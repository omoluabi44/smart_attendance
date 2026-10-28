"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  ScanFace,
  Camera,
  Video,
  UploadCloud,
  X,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Aperture,
  Users,
  SwitchCamera,
} from "lucide-react";
import { toast } from "react-toastify";
import { useLiveFaceDetector } from "@/app/lib/useLiveFaceDetector";

const MIN_GREEN_PIXELS = 55; // 55 x 55 minimum pixel requirement for Green bounding box

export default function VisionScannerModal({
  isOpen,
  onClose,
  courseID,
  sessionName,
  onStartScan,
}) {
  const [scanTab, setScanTab] = useState("photo"); // "photo" | "video" | "webcam"
  const [dragActive, setDragActive] = useState(false);

  // Webcam state
  const videoRef = useRef(null);
  const canvasRef = useRef(null); // Offscreen clean frame capture canvas
  const overlayCanvasRef = useRef(null); // Live HUD bounding-box overlay canvas
  const streamRef = useRef(null);
  const isRequestingCameraRef = useRef(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameraErrorCode, setCameraErrorCode] = useState(null);
  const [permissionState, setPermissionState] = useState("unknown"); // "prompt" | "granted" | "denied" | "system_blocked" | "unknown"
  const [facingMode, setFacingMode] = useState("user"); // Default "user" for laptop/desktop compatibility, can flip to "environment"
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState(null);
  const [capturedStats, setCapturedStats] = useState(null);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Real-time client-side face detector on live camera stream
  const {
    modelReady,
    modelError,
    totalFaces,
    greenFaces,
    redFaces,
  } = useLiveFaceDetector({
    videoRef,
    overlayCanvasRef,
    enabled: Boolean(
      isOpen && scanTab === "webcam" && cameraActive && !capturedBlob
    ),
    minPixelSize: MIN_GREEN_PIXELS,
    mirrored: false,
  });

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const checkBrowserCameraPermission = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      return "unknown";
    }
    try {
      const status = await navigator.permissions.query({ name: "camera" });
      setPermissionState(status.state);
      return status.state;
    } catch {
      return "unknown";
    }
  }, []);

  const startCamera = useCallback(
    async (overrideDeviceId) => {
      if (isRequestingCameraRef.current) return;
      isRequestingCameraRef.current = true;
      setIsStartingCamera(true);
      setCameraError(null);
      setCameraErrorCode(null);
      stopCamera();

      try {
        if (typeof window !== "undefined" && !window.isSecureContext) {
          setCameraErrorCode("INSECURE_CONTEXT");
          setCameraError(
            "Browser blocked camera access because this page is not running on HTTPS or http://localhost."
          );
          return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraErrorCode("UNSUPPORTED");
          setCameraError("Camera API is not supported in this browser.");
          return;
        }

        await checkBrowserCameraPermission();

        const targetDeviceId =
          overrideDeviceId !== undefined ? overrideDeviceId : selectedDeviceId;

        // Progressive constraint fallback so strict constraints never block camera startup
        const constraintCandidates = [
          targetDeviceId
            ? {
                video: {
                  deviceId: { exact: targetDeviceId },
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                },
                audio: false,
              }
            : {
                video: {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  facingMode: { ideal: facingMode },
                },
                audio: false,
              },
          {
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          },
          { video: true, audio: false },
        ];

        let lastErr = null;
        for (const constraints of constraintCandidates) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              try {
                await videoRef.current.play();
              } catch {
                // autoPlay handles playback
              }
            }
            setPermissionState("granted");
            setCameraActive(true);

            // Populate available camera devices once permission is granted
            try {
              const devices = await navigator.mediaDevices.enumerateDevices();
              const cams = devices.filter((d) => d.kind === "videoinput");
              setVideoDevices(cams);
            } catch {
              // ignore enumerate error
            }
            return;
          } catch (err) {
            lastErr = err;
            // If the user or browser explicitly denied permission, don't re-prompt in a loop
            if (
              err?.name === "NotAllowedError" ||
              err?.name === "PermissionDeniedError" ||
              err?.name === "SecurityError"
            ) {
              break;
            }
          }
        }

        // Use console.warn instead of console.error so Next.js 15 Dev Overlay does not crash the UI
        const errName = lastErr?.name || "CameraError";
        const errMsg = lastErr?.message || "";
        console.warn("Camera access unavailable:", errName, errMsg);
        setCameraErrorCode(errName);

        const latestPermState = await checkBrowserCameraPermission();
        const isSystemDenied =
          errMsg.toLowerCase().includes("system") ||
          (latestPermState === "granted" &&
            (errName === "NotAllowedError" ||
              errName === "PermissionDeniedError"));

        if (isSystemDenied) {
          setPermissionState("system_blocked");
          setCameraError(
            "Windows OS Camera Privacy Settings is blocking your browser from accessing the webcam."
          );
        } else if (
          errName === "NotAllowedError" ||
          errName === "PermissionDeniedError" ||
          errName === "SecurityError"
        ) {
          if (latestPermState === "denied") {
            setCameraError(
              "Camera permission is set to 'Blocked' in your browser address bar, so the browser suppresses the permission popup."
            );
          } else {
            setCameraError(
              "Camera permission was dismissed or blocked by your browser or OS settings."
            );
          }
        } else if (
          errName === "NotFoundError" ||
          errName === "DevicesNotFoundError"
        ) {
          setCameraError(
            "No camera device was detected on this computer/device."
          );
        } else if (
          errName === "NotReadableError" ||
          errName === "TrackStartError"
        ) {
          setCameraError(
            "Your camera is currently in use by another application (e.g., Zoom, Teams, Camera app) or browser tab."
          );
        } else {
          setCameraError(
            errMsg ||
              "Unable to access camera. Check browser permissions or use Group Photo upload."
          );
        }
      } finally {
        isRequestingCameraRef.current = false;
        setIsStartingCamera(false);
      }
    },
    [facingMode, selectedDeviceId, stopCamera, checkBrowserCameraPermission]
  );

  // Ensure videoRef always gets the active stream even if React re-rendered
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [cameraActive]);

  // Listen to browser camera permission changes so flipping "Allow" in the URL bar auto-starts the camera immediately
  useEffect(() => {
    if (!isOpen || scanTab !== "webcam") return;
    let permStatus = null;
    let cancelled = false;

    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "camera" })
        .then((status) => {
          if (cancelled) return;
          permStatus = status;
          setPermissionState(status.state);
          status.onchange = () => {
            setPermissionState(status.state);
            if (status.state === "granted" && !capturedBlob) {
              startCamera();
            }
          };
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      if (permStatus) {
        permStatus.onchange = null;
      }
    };
  }, [isOpen, scanTab, capturedBlob, startCamera]);

  useEffect(() => {
    if (isOpen && scanTab === "webcam" && !capturedBlob) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      if (!isRequestingCameraRef.current) {
        stopCamera();
      }
    };
  }, [isOpen, scanTab, capturedBlob, startCamera, stopCamera]);

  // Revoke object URL on unmount or reset to ensure zero persistent client footprint
  useEffect(() => {
    return () => {
      if (capturedPreviewUrl) {
        URL.revokeObjectURL(capturedPreviewUrl);
      }
    };
  }, [capturedPreviewUrl]);

  if (!isOpen) return null;

  const handleToggleFacingMode = () => {
    setSelectedDeviceId("");
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (greenFaces < 1) {
      toast.warn(
        `At least 1 green face (≥${MIN_GREEN_PIXELS}×${MIN_GREEN_PIXELS}px) is required to capture. Move the camera closer.`
      );
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const snapshotSummary = {
      totalFaces,
      greenFaces,
      redFaces,
    };

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Failed to capture frame");
          return;
        }
        const fileName = `live_scan_${courseID}_${Date.now()}.jpg`;
        const fileObj = new File([blob], fileName, { type: "image/jpeg" });
        const preview = URL.createObjectURL(blob);
        setCapturedBlob(fileObj);
        setCapturedPreviewUrl(preview);
        setCapturedStats(snapshotSummary);
        stopCamera();

        if (snapshotSummary.redFaces > 0) {
          toast.warn(
            `Captured ${snapshotSummary.greenFaces} good face(s), but ${snapshotSummary.redFaces} face(s) were in Red (<${MIN_GREEN_PIXELS}×${MIN_GREEN_PIXELS}px). Move closer and retake if you want to include them.`
          );
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const handleRetake = () => {
    if (capturedPreviewUrl) {
      URL.revokeObjectURL(capturedPreviewUrl);
    }
    setCapturedBlob(null);
    setCapturedPreviewUrl(null);
    setCapturedStats(null);
  };

  const handleSubmitCapturedFrame = () => {
    if (!capturedBlob) return;
    onStartScan(capturedBlob, "image");
    handleRetake();
    onClose();
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    onStartScan(file, isVideo ? "video" : "image");
    onClose();
  };

  const handleFileInput = (e, mode) => {
    const file = e.target.files?.[0];
    if (file) {
      onStartScan(file, mode);
      onClose();
    }
    e.target.value = "";
  };

  const handleCancelModal = () => {
    stopCamera();
    handleRetake();
    onClose();
  };

  const canCapture = cameraActive && greenFaces >= 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-obsidian-950/80 backdrop-blur-md p-0 sm:p-4"
      onClick={handleCancelModal}
    >
      <div
        className="relative w-full max-w-2xl max-h-[96dvh] sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-obsidian-900 border border-slate-800 text-white shadow-2xl overflow-hidden pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Vision Grid */}
        <div className="absolute inset-0 bg-vision-grid-dark opacity-30 pointer-events-none" />

        {/* Corner Biometric Reticles */}
        <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400/70 pointer-events-none" />
        <div className="absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400/70 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400/70 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400/70 pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between gap-2 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0">
              <ScanFace className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-[11px] font-sans text-cyan-400 uppercase tracking-wider truncate">
                  REKOGNITION 1:N SCANNER
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded bg-slate-800 text-[10px] font-sans text-slate-300 shrink-0">
                  COL-{courseID}
                </span>
              </div>
              <h2 className="text-sm sm:text-lg font-bold text-white truncate">
                Capture Attendance ({sessionName})
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancelModal}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition shrink-0"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Cancel</span>
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="relative z-10 px-4 sm:px-6 pt-3 sm:pt-4 shrink-0">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1 rounded-xl bg-obsidian-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setScanTab("photo")}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-sans font-semibold transition ${
                scanTab === "photo"
                  ? "bg-cyan-400 text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">GROUP PHOTO</span>
            </button>
            <button
              type="button"
              onClick={() => setScanTab("webcam")}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-sans font-semibold transition ${
                scanTab === "webcam"
                  ? "bg-cyan-400 text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Aperture className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">LIVE SNAPSHOT</span>
            </button>
            <button
              type="button"
              onClick={() => setScanTab("video")}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-sans font-semibold transition ${
                scanTab === "video"
                  ? "bg-cyan-400 text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Video className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">CLASS VIDEO</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="relative z-10 p-4 sm:p-6 overflow-y-auto flex-1">
          {(scanTab === "photo" || scanTab === "video") && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                }}
                onDrop={handleFileDrop}
                onClick={() =>
                  scanTab === "photo"
                    ? imageInputRef.current?.click()
                    : videoInputRef.current?.click()
                }
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 sm:p-10 text-center transition-all ${
                  dragActive
                    ? "border-cyan-400 bg-cyan-500/10"
                    : "border-slate-700 hover:border-cyan-400/60 bg-obsidian-950/70"
                }`}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 sm:mb-4 text-cyan-400">
                  {scanTab === "photo" ? (
                    <Camera className="w-6 h-6 sm:w-7 sm:h-7" />
                  ) : (
                    <Video className="w-6 h-6 sm:w-7 sm:h-7" />
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                  {scanTab === "photo"
                    ? "Drop Lecture Hall Group Photo or Tap to Browse"
                    : "Drop Classroom Walkthrough Video or Tap to Browse"}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4 sm:mb-5">
                  {scanTab === "photo"
                    ? "Supports high-resolution JPEG/PNG frames. AWS Rekognition detects and matches up to 100 faces simultaneously against the course collection."
                    : "Supports MP4/MOV recordings. Runs asynchronous multi-frame face tracking and deduplicates recognized students."}
                </p>

                <span className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] w-full sm:w-auto rounded-xl bg-white text-slate-950 text-xs font-semibold hover:bg-cyan-300 transition">
                  <UploadCloud className="w-4 h-4" />
                  {scanTab === "photo"
                    ? "Select Classroom Photo"
                    : "Select Classroom Video"}
                </span>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileInput(e, "image")}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => handleFileInput(e, "video")}
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelModal}
                  className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {scanTab === "webcam" && (
            <div className="space-y-3 sm:space-y-4">
              {/* Live Camera Viewport with Real-Time Bounding Box Canvas */}
              <div className="relative rounded-2xl overflow-hidden bg-obsidian-950 border border-slate-800 aspect-[3/4] sm:aspect-video flex items-center justify-center">
                {/* Keep video element always mounted so videoRef.current is never null when stream starts */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={
                    cameraError || capturedPreviewUrl
                      ? "hidden"
                      : "w-full h-full object-cover"
                  }
                />

                {cameraError ? (
                  <div className="p-5 text-center max-w-lg space-y-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      {cameraError}
                    </h4>

                    {(cameraErrorCode === "NotAllowedError" ||
                      cameraErrorCode === "PermissionDeniedError" ||
                      cameraErrorCode === "SecurityError") && (
                      <div className="text-left bg-slate-900/95 border border-slate-800 rounded-xl p-3.5 text-[11px] text-slate-300 space-y-2">
                        <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-800">
                          <span className="font-semibold text-cyan-300">
                            Why the popup didn&apos;t appear on Retry:
                          </span>
                          <span className="px-2 py-0.5 rounded bg-rose-950/90 border border-rose-500/50 font-sans text-[10px] font-bold text-rose-300 uppercase">
                            {permissionState === "system_blocked"
                              ? "OS BLOCKED"
                              : permissionState === "denied"
                                ? "BROWSER BLOCKED"
                                : "PERMISSION DENIED"}
                          </span>
                        </div>

                        {permissionState === "system_blocked" ? (
                          <p className="text-slate-300 leading-relaxed">
                            Your browser allowed the site, but{" "}
                            <span className="text-white font-semibold">
                              Windows Camera Privacy
                            </span>{" "}
                            is turned off for your browser. Click{" "}
                            <span className="text-cyan-300 font-semibold">
                              Open Windows Camera Settings
                            </span>{" "}
                            below and turn ON camera access for your browser.
                          </p>
                        ) : (
                          <>
                            <p className="text-slate-400 leading-relaxed">
                              Once a browser marks a site as{" "}
                              <span className="text-rose-300 font-semibold">
                                Blocked
                              </span>
                              , browsers refuse to show the permission popup from
                              a webpage button until you reset it in the address
                              bar:
                            </p>
                            <ol className="list-decimal list-inside space-y-1 text-slate-300">
                              <li>
                                Click the{" "}
                                <span className="text-white font-semibold">
                                  Tune / Lock icon
                                </span>{" "}
                                at the left end of your browser&apos;s top URL bar
                                (next to <code className="text-cyan-300">localhost:3000</code>).
                              </li>
                              <li>
                                Toggle{" "}
                                <span className="text-emerald-400 font-semibold">
                                  Camera → On / Allow
                                </span>{" "}
                                (or click{" "}
                                <span className="text-white font-semibold">
                                  Reset permission
                                </span>
                                ). The camera will start automatically!
                              </li>
                            </ol>
                          </>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <a
                            href="ms-settings:privacy-webcam"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-[11px] font-semibold transition"
                          >
                            Open Windows Camera Settings
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(
                                "chrome://settings/content/camera"
                              );
                              toast.info(
                                "Copied chrome://settings/content/camera — paste it into a new browser tab to unblock localhost."
                              );
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-semibold transition"
                          >
                            Copy Browser Camera Settings URL
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isStartingCamera}
                        onClick={() => startCamera()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 text-slate-950 text-xs font-bold transition"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            isStartingCamera ? "animate-spin" : ""
                          }`}
                        />
                        {isStartingCamera
                          ? "Requesting Camera..."
                          : "Retry Camera Access"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setScanTab("photo")}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                      >
                        Switch to Photo Upload
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelModal}
                        className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : capturedPreviewUrl ? (
                  <>
                    <img
                      src={capturedPreviewUrl}
                      alt="Captured Classroom Snapshot"
                      className="w-full h-full object-cover"
                    />
                    {capturedStats && (
                      <div className="absolute inset-x-3 top-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                        <div className="flex items-center gap-2 bg-obsidian-950/90 border border-slate-700 px-3 py-1.5 rounded-xl">
                          <Users className="w-4 h-4 text-cyan-400" />
                          <span className="font-sans text-xs font-bold text-white">
                            CAPTURED FACES: {capturedStats.totalFaces}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/60 font-sans text-[11px] font-bold text-emerald-300">
                            ✓ {capturedStats.greenFaces} GOOD (≥55×55px)
                          </span>
                          {capturedStats.redFaces > 0 && (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-950/90 border border-rose-500/60 font-sans text-[11px] font-bold text-rose-300">
                              ⚠ {capturedStats.redFaces} TOO SMALL (&lt;55×55px)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Real-Time Face Detection Rectangle Overlay Canvas */}
                    <canvas
                      ref={overlayCanvasRef}
                      className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    />

                    {/* Live HUD Overlay (Face Counter + Resolution Legend + Guidance) */}
                    <div className="absolute inset-3 z-20 pointer-events-none flex flex-col justify-between">
                      {/* Top HUD Bar: Live Face Counter & Camera Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Primary Live Face Count Badge */}
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-obsidian-950/90 border border-cyan-400/50 shadow-lg">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                            <span className="font-sans text-xs font-bold text-white tracking-wide">
                              FACES DETECTED:{" "}
                              <span className="text-cyan-300 text-sm">
                                {totalFaces}
                              </span>
                            </span>
                          </div>

                          {/* Green Box Counter (>= 55x55 px) */}
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/60 font-sans text-[11px] font-bold text-emerald-300">
                            ● {greenFaces} GREEN (≥{MIN_GREEN_PIXELS}×
                            {MIN_GREEN_PIXELS}px)
                          </span>

                          {/* Red Box Counter (< 55x55 px - Move Closer) */}
                          <span
                            className={`px-2.5 py-1 rounded-lg font-sans text-[11px] font-bold border transition ${
                              redFaces > 0
                                ? "bg-rose-950/95 border-rose-500 text-rose-200 animate-pulse"
                                : "bg-obsidian-950/85 border-slate-700 text-slate-400"
                            }`}
                          >
                            ● {redFaces} RED (&lt;{MIN_GREEN_PIXELS}×
                            {MIN_GREEN_PIXELS}px)
                          </span>
                        </div>

                        {/* Right Controls: Detector Status + Camera Selector / Flip */}
                        <div className="flex items-center gap-1.5 pointer-events-auto">
                          <span className="hidden sm:inline-block px-2 py-1 rounded-lg bg-obsidian-950/85 border border-slate-700 text-[10px] font-sans text-slate-300">
                            {modelError
                              ? "DETECTOR ERROR"
                              : modelReady
                              ? "AI TRACKING ACTIVE"
                              : "LOADING DETECTOR..."}
                          </span>
                          {videoDevices.length > 1 && (
                            <select
                              value={selectedDeviceId}
                              onChange={(e) => {
                                const id = e.target.value;
                                setSelectedDeviceId(id);
                                startCamera(id);
                              }}
                              className="px-2 py-1 rounded-lg bg-obsidian-950/90 border border-slate-700 text-[10px] font-sans text-slate-200 outline-none"
                            >
                              <option value="">Default Cam</option>
                              {videoDevices.map((d, idx) => (
                                <option key={d.deviceId || idx} value={d.deviceId}>
                                  {d.label || `Camera ${idx + 1}`}
                                </option>
                              ))}
                            </select>
                          )}
                          <button
                            type="button"
                            onClick={handleToggleFacingMode}
                            title="Switch Front/Rear Camera"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-obsidian-950/90 hover:bg-slate-800 border border-slate-700 text-[10px] font-sans font-semibold text-cyan-300 transition"
                          >
                            <SwitchCamera className="w-3.5 h-3.5" />
                            <span>FLIP CAM</span>
                          </button>
                        </div>
                      </div>

                      {/* Bottom Dynamic Distance & Pixel Quality Guidance Banner */}
                      <div className="flex justify-center">
                        {redFaces > 0 && greenFaces === 0 ? (
                          <div className="px-3.5 py-1.5 rounded-xl bg-rose-950/95 border border-rose-500 text-rose-200 font-sans text-[11px] font-bold text-center shadow-lg">
                            ⚠ RED BOX: FACE CLEAR BUT TOO SMALL (&lt;
                            {MIN_GREEN_PIXELS}×{MIN_GREEN_PIXELS}PX) — MOVE
                            CAMERA CLOSER
                          </div>
                        ) : redFaces > 0 && greenFaces > 0 ? (
                          <div className="px-3.5 py-1.5 rounded-xl bg-amber-950/95 border border-amber-400 text-amber-200 font-sans text-[11px] font-bold text-center shadow-lg">
                            ⚠ {greenFaces} GREEN (GOOD PIXEL) • MOVE CAMERA
                            CLOSER FOR {redFaces} RED FACE(S) (&lt;
                            {MIN_GREEN_PIXELS}×{MIN_GREEN_PIXELS}PX)
                          </div>
                        ) : greenFaces > 0 ? (
                          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/95 border border-emerald-400 text-emerald-200 font-sans text-[11px] font-bold text-center shadow-lg">
                            ✓ {greenFaces} FACE(S) AT GOOD PIXEL RESOLUTION (≥
                            {MIN_GREEN_PIXELS}×{MIN_GREEN_PIXELS}PX) — READY TO
                            CAPTURE
                          </div>
                        ) : (
                          <div className="px-3.5 py-1.5 rounded-xl bg-obsidian-950/85 border border-slate-700 text-slate-300 font-sans text-[10px] text-center">
                            HOLD CAMERA OVER CLASSROOM • GREEN BOX = GOOD PIXEL
                            (≥{MIN_GREEN_PIXELS}×{MIN_GREEN_PIXELS}PX) • RED BOX
                            = MOVE CLOSER
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Offscreen Clean Capture Canvas (un-annotated for AWS Rekognition) */}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Live Detection Telemetry Summary Bar */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                <div className="p-2 sm:p-2.5 rounded-xl bg-obsidian-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-0.5">
                  <span className="text-[9px] sm:text-[10px] font-sans text-slate-400 uppercase leading-tight">
                    TOTAL DETECTED
                  </span>
                  <span className="font-sans text-sm sm:text-base font-bold text-white">
                    {capturedStats ? capturedStats.totalFaces : totalFaces}
                  </span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-0.5">
                  <span className="text-[9px] sm:text-[10px] font-sans text-emerald-400 uppercase leading-tight">
                    GREEN (≥{MIN_GREEN_PIXELS}px)
                  </span>
                  <span className="font-sans text-sm sm:text-base font-bold text-emerald-400">
                    {capturedStats ? capturedStats.greenFaces : greenFaces}
                  </span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-0.5">
                  <span className="text-[9px] sm:text-[10px] font-sans text-rose-400 uppercase leading-tight">
                    RED (CLOSER)
                  </span>
                  <span className="font-sans text-sm sm:text-base font-bold text-rose-400">
                    {capturedStats ? capturedStats.redFaces : redFaces}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleCancelModal}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition"
                >
                  Cancel
                </button>
                {capturedBlob ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retake Snapshot
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitCapturedFrame}
                      className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 min-h-[44px] rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        Run Rekognition Scan (
                        {capturedStats?.greenFaces ?? 0} Good Face
                        {(capturedStats?.greenFaces ?? 0) === 1 ? "" : "s"})
                      </span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={!canCapture}
                    onClick={handleCaptureFrame}
                    className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 min-h-[44px] rounded-xl text-xs font-bold transition text-center ${
                      canCapture
                        ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
                        : redFaces > 0
                        ? "bg-rose-950/80 border border-rose-500/50 text-rose-300 cursor-not-allowed"
                        : "bg-slate-800 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Aperture className="w-4 h-4 shrink-0" />
                    <span>
                      {canCapture
                        ? `Capture Frame (${greenFaces} Green Face${
                            greenFaces === 1 ? "" : "s"
                          }${
                            redFaces > 0
                              ? ` • ${redFaces} Red`
                              : ""
                          })`
                        : redFaces > 0
                        ? `Move Camera Closer — ${redFaces} Face${
                            redFaces === 1 ? "" : "s"
                          } in Red (<${MIN_GREEN_PIXELS}px)`
                        : "Waiting for Faces in Live Feed..."}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Privacy & Architecture Footer */}
        <div className="relative z-10 px-4 sm:px-6 py-3 sm:py-3.5 bg-obsidian-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-sans text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>DIRECT S3 STREAM • NO LOCAL STORAGE</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="text-cyan-400">
              MIN PIXEL: {MIN_GREEN_PIXELS}×{MIN_GREEN_PIXELS}PX
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
