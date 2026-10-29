"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FACE_VERTICES, FACE_INDICES } from "./canonicalFaceMeshData";
import { jetbrainsMono } from "@/app/ui/fonts";
import {
  CpuChipIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

// Key anatomical landmark indices in the 468-vertex MediaPipe canonical face mesh
const KEY_LANDMARKS = new Set([
  1, 4, 6, 10, 33, 133, 362, 263, 61, 291, 0, 17, 152, 234, 454, 70, 300, 168,
  199, 159, 145, 386, 374,
]);

export default function FaceMeshScannerHero() {
  const mountRef = useRef(null);
  const scanLineRef = useRef(null);
  const scanGlowRef = useRef(null);
  const scanReadoutRef = useRef(null);
  const [activeNodesCount, setActiveNodesCount] = useState(468);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer setup
    const scene = new THREE.Scene();
    const width = container.clientWidth || 520;
    const height = container.clientHeight || 460;

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0, 32);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 2. Center and build 468-vertex Canonical 3D Human Face Geometry
    const vertexCount = FACE_VERTICES.length / 3;
    const centeredPositions = new Float32Array(FACE_VERTICES.length);

    // Bounding box of canonical model: X [-7.74, 7.74], Y [-9.40, 8.26], Z [-2.43, 7.58]
    const centerY = -0.57;
    const centerZ = 2.57;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < vertexCount; i++) {
      const x = FACE_VERTICES[i * 3];
      const y = FACE_VERTICES[i * 3 + 1] - centerY;
      const z = FACE_VERTICES[i * 3 + 2] - centerZ;

      centeredPositions[i * 3] = x;
      centeredPositions[i * 3 + 1] = y;
      centeredPositions[i * 3 + 2] = z;

      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    const faceGroup = new THREE.Group();
    scene.add(faceGroup);

    // Base indexed buffer geometry for solid depth occlusion + normals
    const surfaceGeometry = new THREE.BufferGeometry();
    surfaceGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(centeredPositions, 3)
    );
    surfaceGeometry.setIndex(FACE_INDICES);
    surfaceGeometry.computeVertexNormals();

    // Inner white occlusion mesh so back-of-face edges don't clutter front facial features
    const occlusionMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const occlusionMesh = new THREE.Mesh(surfaceGeometry, occlusionMaterial);
    faceGroup.add(occlusionMesh);

    // 3. Triangulated Wireframe Geometry with dynamic per-vertex RGB colors
    const wireframeGeometry = new THREE.WireframeGeometry(surfaceGeometry);
    const wirePosAttr = wireframeGeometry.attributes.position;
    const wireVertexCount = wirePosAttr.count;
    const wireColors = new Float32Array(wireVertexCount * 3);
    wireframeGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(wireColors, 3)
    );

    const wireframeMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
    });
    const wireframeMesh = new THREE.LineSegments(
      wireframeGeometry,
      wireframeMaterial
    );
    faceGroup.add(wireframeMesh);

    // 4. 468 Biometric Landmark Nodes (Points) with circular glow sprite
    const dotCanvas = document.createElement("canvas");
    dotCanvas.width = 64;
    dotCanvas.height = 64;
    const dotCtx = dotCanvas.getContext("2d");
    if (dotCtx) {
      const grad = dotCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.35, "rgba(255, 255, 255, 0.85)");
      grad.addColorStop(0.7, "rgba(255, 255, 255, 0.2)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      dotCtx.fillStyle = grad;
      dotCtx.fillRect(0, 0, 64, 64);
    }
    const dotTexture = new THREE.CanvasTexture(dotCanvas);

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(centeredPositions, 3)
    );
    const pointColors = new Float32Array(vertexCount * 3);
    pointsGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(pointColors, 3)
    );

    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.5,
      map: dotTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const pointsCloud = new THREE.Points(pointsGeometry, pointsMaterial);
    faceGroup.add(pointsCloud);

    // 5. Key Anatomical Anchor Points (larger nodes on eyes, nose tip, lips, jawline)
    const keyIndices = Array.from(KEY_LANDMARKS);
    const keyPositions = new Float32Array(keyIndices.length * 3);
    const keyColors = new Float32Array(keyIndices.length * 3);
    keyIndices.forEach((idx, i) => {
      keyPositions[i * 3] = centeredPositions[idx * 3];
      keyPositions[i * 3 + 1] = centeredPositions[idx * 3 + 1];
      keyPositions[i * 3 + 2] = centeredPositions[idx * 3 + 2] + 0.08;
    });
    const keyGeometry = new THREE.BufferGeometry();
    keyGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(keyPositions, 3)
    );
    keyGeometry.setAttribute("color", new THREE.BufferAttribute(keyColors, 3));
    const keyMaterial = new THREE.PointsMaterial({
      size: 0.85,
      map: dotTexture,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
    const keyPointsCloud = new THREE.Points(keyGeometry, keyMaterial);
    faceGroup.add(keyPointsCloud);

    // 6. 3D Horizontal Green Laser Slice Ring intersecting the face
    const scanRingGeometry = new THREE.RingGeometry(8.2, 8.38, 64);
    scanRingGeometry.rotateX(Math.PI / 2);
    const scanRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
    });
    const scanRing = new THREE.Mesh(scanRingGeometry, scanRingMaterial);
    scene.add(scanRing);

    // Interactive Pointer Parallax
    let targetPointerX = 0;
    let targetPointerY = 0;
    let currentPointerX = 0;
    let currentPointerY = 0;

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetPointerX = nx * 0.35;
      targetPointerY = ny * 0.18;
    };

    const handlePointerLeave = () => {
      targetPointerX = 0;
      targetPointerY = 0;
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 520;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 7. Animation Loop: Horizontal Green Scanline + Dynamic Per-Vertex Illumination
    let animationFrameId;
    const startTime = performance.now();

    const animate = (now) => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = (now - startTime) * 0.001;

      // Smoothly oscillate scanProgress between 0 (top) and 1 (bottom) using a sine wave
      const scanWave = 0.5 - 0.5 * Math.cos(elapsed * 1.65); // 0 -> 1 -> 0
      const scanDirection = Math.sin(elapsed * 1.65) >= 0 ? 1 : -1; // 1 = moving down, -1 = moving up

      // Map scanWave [0..1] to 3D Y coordinate [maxY + 0.8 .. minY - 0.8]
      const upperY = maxY + 0.6;
      const lowerY = minY - 0.6;
      const scanY = upperY - scanWave * (upperY - lowerY);

      // Update 3D laser ring Y position
      scanRing.position.y = scanY;
      scanRing.rotation.z = elapsed * 0.4;

      // Sync HTML horizontal green laser bar position with the 3D mesh vertical bounds
      const cssPercent = 10 + scanWave * 80; // 10% to 90% of viewport height
      if (scanLineRef.current) {
        scanLineRef.current.style.top = `${cssPercent}%`;
      }
      if (scanGlowRef.current) {
        scanGlowRef.current.style.top = `${cssPercent}%`;
        scanGlowRef.current.style.transform =
          scanDirection > 0 ? "translateY(-100%)" : "translateY(0%)";
        scanGlowRef.current.style.background =
          scanDirection > 0
            ? "linear-gradient(to bottom, rgba(16,185,129,0), rgba(16,185,129,0.22))"
            : "linear-gradient(to top, rgba(16,185,129,0), rgba(16,185,129,0.22))";
      }
      if (scanReadoutRef.current) {
        scanReadoutRef.current.textContent = `SCAN_Y: ${
          scanY >= 0 ? "+" : ""
        }${scanY.toFixed(2)}cm`;
      }

      // Smooth 3D rotation + pointer parallax
      currentPointerX += (targetPointerX - currentPointerX) * 0.06;
      currentPointerY += (targetPointerY - currentPointerY) * 0.06;

      faceGroup.rotation.y =
        Math.sin(elapsed * 0.65) * 0.34 + currentPointerX;
      faceGroup.rotation.x =
        Math.cos(elapsed * 0.45) * 0.07 + currentPointerY;

      // Update Wireframe Vertex Colors based on distance to Horizontal Green Scanline
      const laserHalfBand = 1.35; // Active laser beam thickness in 3D units
      const trailLength = 3.6; // Trailing green afterglow length

      for (let i = 0; i < wireVertexCount; i++) {
        const vy = wirePosAttr.getY(i);
        const vz = wirePosAttr.getZ(i);
        const depthFactor = THREE.MathUtils.clamp((vz + 5) / 10, 0.25, 1.0);

        const dist = Math.abs(vy - scanY);
        // Trail is behind the direction of scan travel
        const signedDelta = (vy - scanY) * scanDirection;

        let greenIntensity = 0;
        if (dist < laserHalfBand) {
          greenIntensity = 1.0 - dist / laserHalfBand;
          greenIntensity = Math.pow(greenIntensity, 0.65);
        } else if (signedDelta > 0 && signedDelta < trailLength) {
          greenIntensity =
            0.55 * (1.0 - (signedDelta - laserHalfBand) / trailLength);
          greenIntensity = Math.max(0, greenIntensity);
        }

        // Base brand-blue wireframe color fading to white in depth
        const baseR = THREE.MathUtils.lerp(1.0, 0.0, depthFactor);
        const baseG = THREE.MathUtils.lerp(1.0, 0.48, depthFactor);
        const baseB = 1.0;

        // Active emerald-green scan color: R=0.06, G=0.72, B=0.5
        wireColors[i * 3] = THREE.MathUtils.lerp(baseR, 0.06, greenIntensity);
        wireColors[i * 3 + 1] = THREE.MathUtils.lerp(
          baseG,
          0.72,
          greenIntensity
        );
        wireColors[i * 3 + 2] = THREE.MathUtils.lerp(
          baseB,
          0.5,
          greenIntensity
        );
      }
      wireframeGeometry.attributes.color.needsUpdate = true;

      // Update 468 Landmark Node Colors
      for (let i = 0; i < vertexCount; i++) {
        const vy = centeredPositions[i * 3 + 1];
        const vz = centeredPositions[i * 3 + 2];
        const depthFactor = THREE.MathUtils.clamp((vz + 5) / 10, 0.3, 1.0);
        const dist = Math.abs(vy - scanY);
        const signedDelta = (vy - scanY) * scanDirection;

        let greenIntensity = 0;
        if (dist < laserHalfBand * 1.15) {
          greenIntensity = 1.0 - dist / (laserHalfBand * 1.15);
        } else if (signedDelta > 0 && signedDelta < trailLength) {
          greenIntensity = 0.6 * (1.0 - signedDelta / trailLength);
        }

        const baseR = THREE.MathUtils.lerp(1.0, 0.0, depthFactor);
        const baseG = THREE.MathUtils.lerp(1.0, 0.48, depthFactor);
        const baseB = 1.0;

        pointColors[i * 3] = THREE.MathUtils.lerp(
          baseR,
          0.06,
          greenIntensity
        );
        pointColors[i * 3 + 1] = THREE.MathUtils.lerp(
          baseG,
          0.72,
          greenIntensity
        );
        pointColors[i * 3 + 2] = THREE.MathUtils.lerp(
          baseB,
          0.5,
          greenIntensity
        );
      }
      pointsGeometry.attributes.color.needsUpdate = true;

      // Update Key Anatomical Anchor Landmarks
      for (let i = 0; i < keyIndices.length; i++) {
        const vy = keyPositions[i * 3 + 1];
        const dist = Math.abs(vy - scanY);
        const hit = dist < 1.8 ? 1.0 - dist / 1.8 : 0;

        keyColors[i * 3] = THREE.MathUtils.lerp(0.0, 0.06, hit);
        keyColors[i * 3 + 1] = THREE.MathUtils.lerp(0.48, 0.72, hit);
        keyColors[i * 3 + 2] = THREE.MathUtils.lerp(1.0, 0.5, hit);
      }
      keyGeometry.attributes.color.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      surfaceGeometry.dispose();
      wireframeGeometry.dispose();
      pointsGeometry.dispose();
      keyGeometry.dispose();
      scanRingGeometry.dispose();
      occlusionMaterial.dispose();
      wireframeMaterial.dispose();
      pointsMaterial.dispose();
      keyMaterial.dispose();
      scanRingMaterial.dispose();
      dotTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative rounded-2xl bg-white border border-blue-100 shadow-[0_28px_70px_-15px_rgba(0,123,255,0.15)] overflow-hidden text-slate-800 select-none">
      {/* Top Biometric Scanner HUD Bar */}
      <div className="px-4 sm:px-5 py-3 bg-slate-50/95 border-b border-blue-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0 shadow-[0_0_8px_#10B981]" />
          <span
            className={`${jetbrainsMono.className} text-[10px] sm:text-xs font-semibold text-emerald-600 tracking-wider truncate`}
          >
            SMART ATTENDANCE • LIVE SCAN
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            ref={scanReadoutRef}
            className={`${jetbrainsMono.className} hidden sm:inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200`}
          >
            SCAN_Y: +0.00cm
          </span>
          <span
            className={`${jetbrainsMono.className} text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200`}
          >
            {activeNodesCount} NODES
          </span>
        </div>
      </div>

      {/* Main 3D Face Mesh Viewport */}
      <div className="relative h-[380px] sm:h-[430px] w-full bg-vision-grid bg-white overflow-hidden">
        {/* Radial Emerald & Blue Ambient Backlight */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),rgba(0,123,255,0.05)_45%,transparent_75%)]" />

        {/* Corner Biometric Viewfinder Reticles */}
        <div className="pointer-events-none absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-400/50 rounded-tl-md z-20" />
        <div className="pointer-events-none absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-400/50 rounded-tr-md z-20" />
        <div className="pointer-events-none absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-400/50 rounded-bl-md z-20" />
        <div className="pointer-events-none absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-400/50 rounded-br-md z-20" />

        {/* Subtle Top-Left & Top-Right Telemetry Overlays */}
        <div className="pointer-events-none absolute top-6 left-7 z-20 hidden sm:flex flex-col gap-1">
          <span
            className={`${jetbrainsMono.className} text-[10px] text-slate-500 uppercase tracking-widest`}
          >
            STATUS: SCANNING CLASSROOM
          </span>
          <span
            className={`${jetbrainsMono.className} text-[10px] text-emerald-600 font-semibold`}
          >
            VERIFICATION: ACTIVE
          </span>
        </div>

        <div className="pointer-events-none absolute top-6 right-7 z-20 hidden sm:flex flex-col items-end gap-1">
          <span
            className={`${jetbrainsMono.className} text-[10px] text-slate-500 uppercase tracking-widest`}
          >
            ACCURACY RATE
          </span>
          <span
            className={`${jetbrainsMono.className} text-xs text-emerald-600 font-bold`}
          >
            99.84%
          </span>
        </div>

        {/* Trailing Green Laser Glow Wash */}
        <div
          ref={scanGlowRef}
          className="pointer-events-none absolute inset-x-0 h-14 z-20"
          style={{ top: "15%" }}
        />

        {/* Horizontal Green Scanning Laser Line Going Up and Down */}
        <div
          ref={scanLineRef}
          className="pointer-events-none absolute inset-x-0 z-30 flex items-center"
          style={{ top: "15%" }}
        >
          {/* Outer Emerald Laser Glow */}
          <div className="w-full h-[2.5px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_3px_rgba(16,185,129,0.5)]" />
          {/* Left & Right Laser Edge Markers */}
          <span className="absolute left-3 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span className="absolute right-3 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        </div>

        {/* Three.js WebGL Canvas Mount */}
        <div
          ref={mountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing relative z-10"
          title="Move cursor to inspect 3D face mesh"
        />
      </div>

      {/* Bottom Biometric Verification Telemetry Bar */}
      <div className="px-4 sm:px-5 py-3 bg-slate-50/95 border-t border-blue-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 text-slate-600">
          <CpuChipIcon className="w-4 h-4 text-blue-500 shrink-0" />
          <span className={`${jetbrainsMono.className} text-[10px] sm:text-[11px] truncate`}>
            COURSE: GET201 • APPLIED THERMODYNAMICS
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
            <ShieldCheckIcon className="w-4 h-4 shrink-0" />
            <span className={`${jetbrainsMono.className} text-[10px] sm:text-[11px]`}>
              ATTENDANCE VERIFIED
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
