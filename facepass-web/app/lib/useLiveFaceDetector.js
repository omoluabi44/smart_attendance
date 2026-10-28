"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const MIN_GREEN_PIXEL_SIZE = 55; // Minimum 55x55 pixels required for Green box
const TRACK_RETENTION_MS = 1400; // Keep track memory briefly so detector flicker doesn't double-count
const VISIBLE_GRACE_MS = 180; // Only draw boxes currently in view

let faceApiModulePromise = null;
let modelLoadedGlobal = false;

async function ensureFaceDetectorLoaded() {
  if (typeof window === "undefined") return null;
  if (!faceApiModulePromise) {
    faceApiModulePromise = (async () => {
      const faceapi = await import(
        "@vladmandic/face-api/dist/face-api.esm.js"
      );
      if (faceapi.tf) {
        try {
          await faceapi.tf.setBackend("webgl");
          await faceapi.tf.ready();
        } catch {
          await faceapi.tf.setBackend("cpu");
          await faceapi.tf.ready();
        }
      }
      if (!modelLoadedGlobal) {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        modelLoadedGlobal = true;
      }
      return faceapi;
    })();
  }
  return faceApiModulePromise;
}

/**
 * Real-time face detection & cumulative capture tracker hook for the lecturer live camera feed.
 * - Draws Green (>= 55x55px) and Red (< 55x55px, move closer) rectangle boxes on the overlay canvas.
 * - Once a face turns Green while recording is active, the cumulative counter increments and
 *   NEVER decreases when the lecturer moves the camera past the student.
 */
export function useLiveFaceDetector({
  videoRef,
  overlayCanvasRef,
  enabled = false,
  isRecording = false,
  minPixelSize = MIN_GREEN_PIXEL_SIZE,
  mirrored = false,
  onGreenFaceCaptured,
}) {
  const [modelReady, setModelReady] = useState(modelLoadedGlobal);
  const [modelError, setModelError] = useState(null);
  const [faceStats, setFaceStats] = useState({
    capturedGreenFaces: 0,
    totalFaces: 0,
    greenFaces: 0,
    redFaces: 0,
    faces: [],
  });

  const tracksRef = useRef([]);
  const nextTrackIdRef = useRef(1);
  const capturedCountRef = useRef(0);
  const isRecordingRef = useRef(isRecording);
  const onGreenFaceCapturedRef = useRef(onGreenFaceCaptured);
  const isDetectingRef = useRef(false);
  const rafIdRef = useRef(null);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    onGreenFaceCapturedRef.current = onGreenFaceCaptured;
  }, [onGreenFaceCaptured]);

  const resetCaptureCount = useCallback(() => {
    capturedCountRef.current = 0;
    tracksRef.current = tracksRef.current.map((t) => ({
      ...t,
      captured: false,
      captureNumber: null,
      bestArea: 0,
    }));
    setFaceStats((prev) => ({
      ...prev,
      capturedGreenFaces: 0,
    }));
  }, []);

  const clearOverlay = useCallback(() => {
    const canvas = overlayCanvasRef?.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    tracksRef.current = [];
    setFaceStats((prev) => ({
      capturedGreenFaces: capturedCountRef.current,
      totalFaces: 0,
      greenFaces: 0,
      redFaces: 0,
      faces: [],
    }));
  }, [overlayCanvasRef]);

  useEffect(() => {
    if (!enabled) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      clearOverlay();
      return;
    }

    let cancelled = false;
    let detectorOptions = null;
    let faceapiInstance = null;

    const drawBoxesOnOverlay = (detectionsList, videoEl) => {
      const canvas = overlayCanvasRef?.current;
      if (!canvas || !videoEl) return;

      const displayW = canvas.clientWidth;
      const displayH = canvas.clientHeight;
      if (!displayW || !displayH) return;

      const dpr = window.devicePixelRatio || 1;
      if (
        canvas.width !== Math.round(displayW * dpr) ||
        canvas.height !== Math.round(displayH * dpr)
      ) {
        canvas.width = Math.round(displayW * dpr);
        canvas.height = Math.round(displayH * dpr);
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, displayW, displayH);

      const videoW = videoEl.videoWidth || 1280;
      const videoH = videoEl.videoHeight || 720;

      // Calculate exact mapping for <video className="w-full h-full object-cover">
      const scale = Math.max(displayW / videoW, displayH / videoH);
      const offsetX = (displayW - videoW * scale) / 2;
      const offsetY = (displayH - videoH * scale) / 2;

      detectionsList.forEach((face, idx) => {
        const rawX = mirrored
          ? videoW - face.x - face.width
          : face.x;
        const drawX = rawX * scale + offsetX;
        const drawY = face.y * scale + offsetY;
        const drawW = face.width * scale;
        const drawH = face.height * scale;

        const isGreen = face.isGoodPixel || face.captured;
        const strokeColor = isGreen ? "#22c55e" : "#ef4444"; // Emerald-500 vs Red-500
        const fillColor = isGreen
          ? "rgba(34, 197, 94, 0.14)"
          : "rgba(239, 68, 68, 0.16)";
        const badgeBg = isGreen ? "#15803d" : "#dc2626";

        // 1. Subtle tinted fill inside rectangle
        ctx.fillStyle = fillColor;
        ctx.fillRect(drawX, drawY, drawW, drawH);

        // 2. Main bounding rectangle
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 6;
        ctx.strokeRect(drawX, drawY, drawW, drawH);
        ctx.shadowBlur = 0;

        // 3. Reinforced corner brackets for clear classroom visibility
        const cornerLen = Math.max(
          8,
          Math.min(18, Math.min(drawW, drawH) * 0.25)
        );
        ctx.lineWidth = 4;
        ctx.strokeStyle = strokeColor;

        ctx.beginPath();
        // Top-left
        ctx.moveTo(drawX, drawY + cornerLen);
        ctx.lineTo(drawX, drawY);
        ctx.lineTo(drawX + cornerLen, drawY);
        // Top-right
        ctx.moveTo(drawX + drawW - cornerLen, drawY);
        ctx.lineTo(drawX + drawW, drawY);
        ctx.lineTo(drawX + drawW, drawY + cornerLen);
        // Bottom-left
        ctx.moveTo(drawX, drawY + drawH - cornerLen);
        ctx.lineTo(drawX, drawY + drawH);
        ctx.lineTo(drawX + cornerLen, drawY + drawH);
        // Bottom-right
        ctx.moveTo(drawX + drawW - cornerLen, drawY + drawH);
        ctx.lineTo(drawX + drawW, drawY + drawH);
        ctx.lineTo(drawX + drawW, drawY + drawH - cornerLen);
        ctx.stroke();

        // 4. Pixel resolution & status label pill above (or below) the rectangle
        let labelText;
        if (face.captured && face.captureNumber) {
          labelText = `✓ CAPTURED #${face.captureNumber} • ${face.widthPx}×${face.heightPx}px`;
        } else if (isGreen) {
          labelText = `#${idx + 1} GOOD • ${face.widthPx}×${face.heightPx}px`;
        } else {
          labelText = `MOVE CLOSER • ${face.widthPx}×${face.heightPx}px`;
        }

        ctx.font = "bold 11px ui-monospace, SFMono-Regular, Menlo, monospace";
        const textMetrics = ctx.measureText(labelText);
        const padX = 6;
        const pillH = 20;
        const pillW = textMetrics.width + padX * 2;
        const pillX = Math.max(
          4,
          Math.min(displayW - pillW - 4, drawX)
        );
        const pillY =
          drawY - pillH - 4 >= 4 ? drawY - pillH - 4 : drawY + drawH + 4;

        ctx.fillStyle = badgeBg;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(pillX, pillY, pillW, pillH, 4);
        } else {
          ctx.rect(pillX, pillY, pillW, pillH);
        }
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "middle";
        ctx.fillText(labelText, pillX + padX, pillY + pillH / 2 + 0.5);
      });

      ctx.restore();
    };

    const updateTracksWithDetections = (rawDetections, videoEl) => {
      const now = performance.now();
      const alpha = 0.65;

      // Prune expired tracks that left the camera view more than TRACK_RETENTION_MS ago
      const activeTracks = tracksRef.current.filter(
        (t) => now - t.lastSeenAt <= TRACK_RETENTION_MS
      );

      // Build all candidate (trackIdx, detIdx) pairs with distance score
      const candidatePairs = [];
      for (let tIdx = 0; tIdx < activeTracks.length; tIdx++) {
        const t = activeTracks[tIdx];
        const tcx = t.x + t.width / 2;
        const tcy = t.y + t.height / 2;
        const predCx = tcx + (t.vx || 0);
        const predCy = tcy + (t.vy || 0);

        for (let dIdx = 0; dIdx < rawDetections.length; dIdx++) {
          const d = rawDetections[dIdx];
          const dcx = d.x + d.width / 2;
          const dcy = d.y + d.height / 2;

          const distRaw = Math.hypot(dcx - tcx, dcy - tcy);
          const distPred = Math.hypot(dcx - predCx, dcy - predCy);
          const dist = Math.min(distRaw, distPred);

          const refSize = Math.max(d.width, d.height, t.width, t.height);
          const maxAllowedDist = Math.max(refSize * 1.85, 140);

          if (dist <= maxAllowedDist) {
            candidatePairs.push({ tIdx, dIdx, dist });
          }
        }
      }

      // Greedy global nearest-neighbor matching
      candidatePairs.sort((a, b) => a.dist - b.dist);
      const matchedTrackIndices = new Set();
      const matchedDetIndices = new Set();
      const trackToDetMap = new Map();

      for (const pair of candidatePairs) {
        if (
          matchedTrackIndices.has(pair.tIdx) ||
          matchedDetIndices.has(pair.dIdx)
        ) {
          continue;
        }
        matchedTrackIndices.add(pair.tIdx);
        matchedDetIndices.add(pair.dIdx);
        trackToDetMap.set(pair.tIdx, pair.dIdx);
      }

      const updatedTracks = [];

      // 1. Update matched and unmatched existing tracks
      for (let tIdx = 0; tIdx < activeTracks.length; tIdx++) {
        const prevTrack = activeTracks[tIdx];
        if (trackToDetMap.has(tIdx)) {
          const det = rawDetections[trackToDetMap.get(tIdx)];
          const prevCx = prevTrack.x + prevTrack.width / 2;
          const prevCy = prevTrack.y + prevTrack.height / 2;

          const sx = prevTrack.x * (1 - alpha) + det.x * alpha;
          const sy = prevTrack.y * (1 - alpha) + det.y * alpha;
          const sw = prevTrack.width * (1 - alpha) + det.width * alpha;
          const sh = prevTrack.height * (1 - alpha) + det.height * alpha;

          const newCx = sx + sw / 2;
          const newCy = sy + sh / 2;

          const widthPx = Math.round(sw);
          const heightPx = Math.round(sh);
          const isGoodPixel =
            widthPx >= minPixelSize && heightPx >= minPixelSize;
          const area = widthPx * heightPx;

          let captured = prevTrack.captured;
          let captureNumber = prevTrack.captureNumber;
          let bestArea = prevTrack.bestArea || 0;

          if (isRecordingRef.current && isGoodPixel) {
            if (!captured) {
              captured = true;
              capturedCountRef.current += 1;
              captureNumber = capturedCountRef.current;
              bestArea = area;
              if (onGreenFaceCapturedRef.current) {
                onGreenFaceCapturedRef.current(
                  {
                    trackId: prevTrack.trackId,
                    captureNumber,
                    x: det.x,
                    y: det.y,
                    width: det.width,
                    height: det.height,
                    widthPx,
                    heightPx,
                    isNew: true,
                  },
                  videoEl
                );
              }
            } else if (area > bestArea * 1.1) {
              bestArea = area;
              if (onGreenFaceCapturedRef.current) {
                onGreenFaceCapturedRef.current(
                  {
                    trackId: prevTrack.trackId,
                    captureNumber,
                    x: det.x,
                    y: det.y,
                    width: det.width,
                    height: det.height,
                    widthPx,
                    heightPx,
                    isNew: false,
                  },
                  videoEl
                );
              }
            }
          }

          updatedTracks.push({
            trackId: prevTrack.trackId,
            x: sx,
            y: sy,
            width: sw,
            height: sh,
            vx: (newCx - prevCx) * 0.5,
            vy: (newCy - prevCy) * 0.5,
            widthPx,
            heightPx,
            isGoodPixel,
            captured,
            captureNumber,
            bestArea,
            score: det.score,
            lastSeenAt: now,
            missedFrames: 0,
          });
        } else {
          updatedTracks.push({
            ...prevTrack,
            missedFrames: (prevTrack.missedFrames || 0) + 1,
          });
        }
      }

      // 2. Register newly detected faces
      for (let dIdx = 0; dIdx < rawDetections.length; dIdx++) {
        if (matchedDetIndices.has(dIdx)) continue;
        const det = rawDetections[dIdx];
        const widthPx = Math.round(det.width);
        const heightPx = Math.round(det.height);
        const isGoodPixel =
          widthPx >= minPixelSize && heightPx >= minPixelSize;
        const area = widthPx * heightPx;
        const trackId = nextTrackIdRef.current++;

        let captured = false;
        let captureNumber = null;
        let bestArea = 0;

        if (isRecordingRef.current && isGoodPixel) {
          captured = true;
          capturedCountRef.current += 1;
          captureNumber = capturedCountRef.current;
          bestArea = area;
          if (onGreenFaceCapturedRef.current) {
            onGreenFaceCapturedRef.current(
              {
                trackId,
                captureNumber,
                x: det.x,
                y: det.y,
                width: det.width,
                height: det.height,
                widthPx,
                heightPx,
                isNew: true,
              },
              videoEl
            );
          }
        }

        updatedTracks.push({
          trackId,
          x: det.x,
          y: det.y,
          width: det.width,
          height: det.height,
          vx: 0,
          vy: 0,
          widthPx,
          heightPx,
          isGoodPixel,
          captured,
          captureNumber,
          bestArea,
          score: det.score,
          lastSeenAt: now,
          missedFrames: 0,
        });
      }

      tracksRef.current = updatedTracks;

      // Return only currently visible tracks for drawing on the live viewfinder
      const visibleTracks = updatedTracks.filter(
        (t) => t.missedFrames === 0 || now - t.lastSeenAt <= VISIBLE_GRACE_MS
      );
      visibleTracks.sort((a, b) => a.x - b.x);
      return visibleTracks;
    };

    const runLoop = async () => {
      if (cancelled) return;

      const videoEl = videoRef?.current;
      if (
        videoEl &&
        videoEl.readyState >= 2 &&
        !videoEl.paused &&
        !videoEl.ended &&
        videoEl.videoWidth > 0 &&
        faceapiInstance &&
        detectorOptions &&
        !isDetectingRef.current
      ) {
        isDetectingRef.current = true;
        try {
          const results = await faceapiInstance.detectAllFaces(
            videoEl,
            detectorOptions
          );

          if (!cancelled) {
            const rawBoxes = (results || []).map((r) => ({
              x: r.box.x,
              y: r.box.y,
              width: r.box.width,
              height: r.box.height,
              score: r.score,
            }));

            const visibleFaces = updateTracksWithDetections(rawBoxes, videoEl);
            drawBoxesOnOverlay(visibleFaces, videoEl);

            let liveGreenCount = 0;
            let liveRedCount = 0;
            visibleFaces.forEach((f) => {
              if (f.isGoodPixel || f.captured) liveGreenCount += 1;
              else liveRedCount += 1;
            });

            const cumulativeGreen = capturedCountRef.current;

            setFaceStats({
              capturedGreenFaces: cumulativeGreen,
              totalFaces: isRecordingRef.current
                ? Math.max(cumulativeGreen, visibleFaces.length)
                : visibleFaces.length,
              greenFaces: isRecordingRef.current
                ? cumulativeGreen
                : liveGreenCount,
              liveGreenFaces: liveGreenCount,
              redFaces: liveRedCount,
              faces: visibleFaces,
            });
          }
        } catch (err) {
          console.warn("Live face detection frame warning:", err?.message || err);
        } finally {
          isDetectingRef.current = false;
        }
      }

      if (!cancelled) {
        rafIdRef.current = requestAnimationFrame(runLoop);
      }
    };

    (async () => {
      try {
        setModelError(null);
        faceapiInstance = await ensureFaceDetectorLoaded();
        if (cancelled || !faceapiInstance) return;

        // inputSize 608 allows detecting both small faces (<55x55px) and large faces (>=55x55px) in classroom views
        detectorOptions = new faceapiInstance.TinyFaceDetectorOptions({
          inputSize: 608,
          scoreThreshold: 0.35,
        });

        setModelReady(true);
        rafIdRef.current = requestAnimationFrame(runLoop);
      } catch (err) {
        console.warn("Failed to initialize live face detector:", err?.message || err);
        if (!cancelled) {
          setModelError("Unable to initialize live face detector.");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [enabled, minPixelSize, mirrored, videoRef, overlayCanvasRef, clearOverlay]);

  return {
    modelReady,
    modelError,
    capturedGreenFaces: faceStats.capturedGreenFaces,
    totalFaces: faceStats.totalFaces,
    greenFaces: faceStats.greenFaces,
    liveGreenFaces: faceStats.liveGreenFaces || 0,
    redFaces: faceStats.redFaces,
    faces: faceStats.faces,
    resetCaptureCount,
  };
}
