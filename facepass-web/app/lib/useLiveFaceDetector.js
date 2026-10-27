"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const MIN_GREEN_PIXEL_SIZE = 55; // Minimum 55x55 pixels required for Green box

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
 * Real-time face detection hook for the lecturer live camera feed.
 * Draws Green (>= 55x55px) and Red (< 55x55px, move closer) rectangle boxes
 * on the overlay canvas and tracks live face counts.
 */
export function useLiveFaceDetector({
  videoRef,
  overlayCanvasRef,
  enabled = false,
  minPixelSize = MIN_GREEN_PIXEL_SIZE,
  mirrored = false,
}) {
  const [modelReady, setModelReady] = useState(modelLoadedGlobal);
  const [modelError, setModelError] = useState(null);
  const [faceStats, setFaceStats] = useState({
    totalFaces: 0,
    greenFaces: 0,
    redFaces: 0,
    faces: [],
  });

  const smoothedBoxesRef = useRef([]);
  const isDetectingRef = useRef(false);
  const rafIdRef = useRef(null);

  const clearOverlay = useCallback(() => {
    const canvas = overlayCanvasRef?.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    smoothedBoxesRef.current = [];
    setFaceStats({
      totalFaces: 0,
      greenFaces: 0,
      redFaces: 0,
      faces: [],
    });
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

        const isGreen = face.isGoodPixel;
        const strokeColor = isGreen ? "#22c55e" : "#ef4444"; // Emerald-500 vs Red-500
        const fillColor = isGreen
          ? "rgba(34, 197, 94, 0.12)"
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
        const labelText = isGreen
          ? `#${idx + 1} GOOD • ${face.widthPx}×${face.heightPx}px`
          : `#${idx + 1} MOVE CLOSER • ${face.widthPx}×${face.heightPx}px`;

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

    const smoothDetections = (rawDetections) => {
      const prev = smoothedBoxesRef.current;
      const alpha = 0.65; // responsiveness weight
      const usedPrev = new Set();

      const nextSmoothed = rawDetections.map((det) => {
        const cx = det.x + det.width / 2;
        const cy = det.y + det.height / 2;

        let bestIdx = -1;
        let bestDist = Infinity;

        for (let i = 0; i < prev.length; i++) {
          if (usedPrev.has(i)) continue;
          const p = prev[i];
          const pcx = p.x + p.width / 2;
          const pcy = p.y + p.height / 2;
          const dist = Math.hypot(cx - pcx, cy - pcy);
          const maxThreshold = Math.max(det.width, det.height, p.width, p.height) * 0.85;
          if (dist < maxThreshold && dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
          }
        }

        if (bestIdx !== -1) {
          usedPrev.add(bestIdx);
          const p = prev[bestIdx];
          const sx = p.x * (1 - alpha) + det.x * alpha;
          const sy = p.y * (1 - alpha) + det.y * alpha;
          const sw = p.width * (1 - alpha) + det.width * alpha;
          const sh = p.height * (1 - alpha) + det.height * alpha;
          const widthPx = Math.round(sw);
          const heightPx = Math.round(sh);
          return {
            x: sx,
            y: sy,
            width: sw,
            height: sh,
            widthPx,
            heightPx,
            isGoodPixel: widthPx >= minPixelSize && heightPx >= minPixelSize,
            score: det.score,
          };
        }

        const widthPx = Math.round(det.width);
        const heightPx = Math.round(det.height);
        return {
          ...det,
          widthPx,
          heightPx,
          isGoodPixel: widthPx >= minPixelSize && heightPx >= minPixelSize,
        };
      });

      // Sort left-to-right for stable face numbering (#1, #2, ...)
      nextSmoothed.sort((a, b) => a.x - b.x);
      smoothedBoxesRef.current = nextSmoothed;
      return nextSmoothed;
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

            const smoothed = smoothDetections(rawBoxes);
            drawBoxesOnOverlay(smoothed, videoEl);

            let greenCount = 0;
            let redCount = 0;
            smoothed.forEach((f) => {
              if (f.isGoodPixel) greenCount += 1;
              else redCount += 1;
            });

            setFaceStats({
              totalFaces: smoothed.length,
              greenFaces: greenCount,
              redFaces: redCount,
              faces: smoothed,
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
    totalFaces: faceStats.totalFaces,
    greenFaces: faceStats.greenFaces,
    redFaces: faceStats.redFaces,
    faces: faceStats.faces,
  };
}
