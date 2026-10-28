"use client";
import React, { useEffect, useRef, useState } from "react";
import { jetbrainsMono } from "@/app/ui/fonts";
import {
  CpuChipIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ViewfinderCircleIcon,
} from "@heroicons/react/24/outline";

/**
 * Generates a realistic, anatomically sculpted 3D human face topology
 * (~460 vertices, triangulated mesh edges, and anatomical landmark anchors).
 */
function createAnatomicalFaceMesh() {
  const rows = 25; // Vertical contours from crown/forehead (-1) to chin (+1)
  const cols = 19; // Horizontal symmetry from left temple (-1) to right temple (+1)

  const vertices = [];
  const gridIndices = [];

  // Gaussian helper for sculpting 3D facial anatomy
  const gauss = (x, mu, sigma) => Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
  const gauss2D = (u, v, muU, muV, sigU, sigV) =>
    gauss(u, muU, sigU) * gauss(v, muV, sigV);

  for (let r = 0; r < rows; r++) {
    const v = -1 + (2 * r) / (rows - 1); // -1 (top of forehead) to +1 (chin tip)
    const rowIndices = [];

    // Sculpt realistic facial silhouette width W(v)
    let widthProfile = 1.0;
    if (v < -0.35) {
      // Forehead dome tapering smoothly to cranium
      const t = (v - -0.35) / -0.65;
      widthProfile = 0.96 - 0.34 * Math.pow(t, 1.7);
    } else if (v <= 0.05) {
      // Temple to zygomatic arch (cheekbone flare)
      widthProfile = 0.96 + 0.06 * gauss(v, -0.08, 0.16);
    } else {
      // Cheekbone tapering through jaw angle (gonion) to sculpted chin (gnathion)
      const t = (v - 0.05) / 0.95;
      const jawFlare = 0.07 * gauss(v, 0.38, 0.16);
      widthProfile = (0.96 + jawFlare) * (1 - 0.64 * Math.pow(t, 1.45));
    }

    for (let c = 0; c < cols; c++) {
      const u = -1 + (2 * c) / (cols - 1); // -1 (left) to +1 (right)
      const absU = Math.abs(u);

      // Base cylindrical cranial wrap
      const theta = u * (Math.PI * 0.44);
      let x = Math.sin(theta) * widthProfile * 118;
      let y = v * 148;
      let z = Math.cos(theta) * widthProfile * 76;

      // Forehead & cranial vertical curvature
      z -= 22 * Math.pow(v, 2);
      if (v < -0.45) {
        z -= 28 * Math.pow((-0.45 - v) / 0.55, 1.6);
      }

      // 1. Superciliary Arch (Brow Ridge) & Glabella
      const browRidge =
        11.5 * gauss(v, -0.31, 0.075) * gauss(absU, 0.32, 0.24) +
        8.5 * gauss2D(u, v, 0, -0.30, 0.14, 0.07);
      z += browRidge;

      // 2. Orbital Sockets (Recessed Concave Eye Cavities) + Eyeball Prominence
      const socketRecess = -18.5 * gauss2D(absU, v, 0.36, -0.15, 0.16, 0.095);
      const eyeballConvex = 9.8 * gauss2D(absU, v, 0.35, -0.15, 0.075, 0.048);
      const lowerEyelid = 3.2 * gauss2D(absU, v, 0.35, -0.06, 0.12, 0.03);
      z += socketRecess + eyeballConvex + lowerEyelid;

      // 3. Nasal Bridge, Dorsum, Pronasale (Nose Tip), and Alar Wings
      const noseProgress = Math.max(0, Math.min(1, (v - -0.30) / 0.48));
      const nasalBridge =
        (14 + 22 * Math.pow(noseProgress, 1.25)) *
        gauss(u, 0, 0.085 + 0.035 * noseProgress) *
        (v >= -0.34 && v <= 0.22
          ? Math.sin(((v - -0.34) / 0.56) * Math.PI)
          : 0);
      const noseTip = 24.5 * gauss2D(u, v, 0, 0.12, 0.095, 0.075);
      const nostrils = 9.5 * gauss2D(absU, v, 0.135, 0.165, 0.055, 0.045);
      const subnasaleIndent = -6.5 * gauss2D(u, v, 0, 0.24, 0.14, 0.045);
      z += nasalBridge + noseTip + nostrils + subnasaleIndent;

      // 4. Zygomatic Arch & Malar Prominence (Cheekbones) + Buccal Hollow
      const cheekbone = 13.5 * gauss2D(absU, v, 0.56, 0.02, 0.20, 0.14);
      const nasolabialFold = -3.8 * gauss2D(absU, v, 0.25 + Math.max(0, v) * 0.25, 0.28, 0.05, 0.14);
      const buccalHollow = -7.2 * gauss2D(absU, v, 0.52, 0.36, 0.16, 0.15);
      z += cheekbone + nasolabialFold + buccalHollow;

      // 5. Labial Contours (Upper Lip Cupid's Bow, Oral Slit, Lower Lip, Philtrum)
      const philtrumDimple = -3.2 * gauss2D(u, v, 0, 0.30, 0.045, 0.05);
      const upperLip =
        13.2 *
        gauss(v, 0.38, 0.042) *
        gauss(u, 0, 0.23) *
        (1 - 0.18 * gauss(u, 0, 0.04));
      const oralCommissure = -6.8 * gauss(v, 0.435, 0.018) * gauss(u, 0, 0.25);
      const lowerLip = 14.0 * gauss(v, 0.49, 0.048) * gauss(u, 0, 0.21);
      const labiomentalCrease = -8.5 * gauss2D(u, v, 0, 0.59, 0.22, 0.055);
      z += philtrumDimple + upperLip + oralCommissure + lowerLip + labiomentalCrease;

      // 6. Mental Protuberance (Chin Boss) & Mandibular Edge
      const chinBoss = 15.5 * gauss2D(u, v, 0, 0.78, 0.22, 0.12);
      const underChin = v > 0.86 ? -22 * Math.pow((v - 0.86) / 0.14, 1.5) : 0;
      z += chinBoss + underChin;

      // Classify anatomical zone for telemetry & visual emphasis
      let zone = "CRANIAL";
      if (v < -0.26) zone = "FRONTAL";
      else if (v < -0.02) zone = "OCULAR";
      else if (v < 0.26) zone = "NASAL";
      else if (v < 0.56) zone = "MAXILLA";
      else zone = "MANDIBLE";

      // Flag key biometric feature nodes (eyes, nose ridge, mouth corners, cheekbones)
      const isFeatureNode =
        (Math.abs(absU - 0.33) < 0.12 && Math.abs(v - -0.15) < 0.09) || // Eyes
        (absU < 0.09 && v > -0.28 && v < 0.18) || // Nasal ridge
        (absU < 0.24 && Math.abs(v - 0.44) < 0.08) || // Lips
        (Math.abs(absU - 0.55) < 0.08 && Math.abs(v - 0.02) < 0.09); // Zygoma

      const idx = vertices.length;
      vertices.push({
        idx,
        x,
        y,
        z,
        u,
        v,
        r,
        c,
        zone,
        isFeatureNode,
      });
      rowIndices.push(idx);
    }
    gridIndices.push(rowIndices);
  }

  // Build Delaunay-style symmetric triangulation & structural wireframe edges
  const edges = [];
  const edgeSet = new Set();
  const triangles = [];

  const addEdge = (a, b, isContour = false) => {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({ a, b, isContour });
    }
  };

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const i00 = gridIndices[r][c];
      const i10 = gridIndices[r][c + 1];
      const i01 = gridIndices[r + 1][c];
      const i11 = gridIndices[r + 1][c + 1];

      // Horizontal contour edges
      addEdge(i00, i10, true);
      if (r === rows - 2) addEdge(i01, i11, true);

      // Vertical meridian edges
      addEdge(i00, i01, false);
      if (c === cols - 2) addEdge(i10, i11, false);

      // Symmetric diagonal triangulation towards the facial midline
      const midCol = (cols - 1) / 2;
      if (c < midCol) {
        addEdge(i00, i11, false);
        triangles.push([i00, i10, i11], [i00, i11, i01]);
      } else {
        addEdge(i10, i01, false);
        triangles.push([i00, i10, i01], [i10, i11, i01]);
      }
    }
  }

  // Named NASA Biometric Landmarks anchored to exact anatomical vertices
  const midC = Math.floor(cols / 2);
  const landmarks = [
    {
      id: "GLABELLA_01",
      label: "FRONTAL // GLABELLA",
      metric: "PITCH +0.4°",
      vertexIdx: gridIndices[4][midC],
      side: "left",
    },
    {
      id: "ORBITAL_L",
      label: "ORBITAL_L // IRIS LOCK",
      metric: "IPD 63.4mm",
      vertexIdx: gridIndices[8][midC - 3],
      side: "left",
    },
    {
      id: "ORBITAL_R",
      label: "ORBITAL_R // RETINA VEC",
      metric: "CONF 99.94%",
      vertexIdx: gridIndices[8][midC + 3],
      side: "right",
    },
    {
      id: "NASION_TIP",
      label: "NASAL // PRONASALE",
      metric: "Z-PEAK +38.2mm",
      vertexIdx: gridIndices[14][midC],
      side: "right",
    },
    {
      id: "ZYGOMA_L",
      label: "ZYGOMATIC // ARCH_L",
      metric: "LIVENESS OK",
      vertexIdx: gridIndices[12][midC - 5],
      side: "left",
    },
    {
      id: "GNATHION_09",
      label: "MANDIBLE // GNATHION",
      metric: "128-D HASH OK",
      vertexIdx: gridIndices[22][midC],
      side: "right",
    },
  ];

  return { vertices, edges, triangles, gridIndices, rows, cols, landmarks };
}

const BIOMETRIC_ZONES = [
  { id: "FRONTAL", label: "01 FRONTAL", range: [-1.0, -0.26] },
  { id: "OCULAR", label: "02 OCULAR", range: [-0.26, -0.02] },
  { id: "NASAL", label: "03 NASAL", range: [-0.02, 0.26] },
  { id: "MAXILLA", label: "04 MAXILLA", range: [0.26, 0.56] },
  { id: "MANDIBLE", label: "05 MANDIBLE", range: [0.56, 1.0] },
];

export default function FaceMeshScannerHUD() {
  const canvasRef = useRef(null);
  const waveformCanvasRef = useRef(null);
  const containerRef = useRef(null);

  const [renderMode, setRenderMode] = useState("wireframe"); // 'wireframe' | 'lidar' | 'points'
  const [activeZone, setActiveZone] = useState("OCULAR");
  const [telemetryReadout, setTelemetryReadout] = useState({
    scanYmm: "+00.0",
    direction: "DESCENDING",
    activeNodes: 42,
    vectorHash: "0x8F4E...92A1",
  });

  // Pointer parallax refs for 60fps interaction without React re-render lag
  const pointerRef = useRef({ targetX: 0, targetY: 0, currentX: 0, currentY: 0 });
  const modeRef = useRef(renderMode);

  useEffect(() => {
    modeRef.current = renderMode;
  }, [renderMode]);

  useEffect(() => {
    const mesh = createAnatomicalFaceMesh();
    const canvas = canvasRef.current;
    const waveCanvas = waveformCanvasRef.current;
    if (!canvas || !waveCanvas) return;

    const ctx = canvas.getContext("2d");
    const waveCtx = waveCanvas.getContext("2d");
    let animationFrameId;
    let startTime = performance.now();
    let lastTelemetryUpdate = 0;

    const handleResize = () => {
      if (!canvas || !waveCanvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const waveRect = waveCanvas.getBoundingClientRect();
      waveCanvas.width = waveRect.width * dpr;
      waveCanvas.height = waveRect.height * dpr;
      waveCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const render = (now) => {
      const elapsed = (now - startTime) / 1000;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const centerX = width * 0.5;
      const centerY = height * 0.5;

      // Scale factor responsive to viewport
      const baseScale = Math.min(width, height) / 365;

      // Smoothly damp pointer parallax
      const ptr = pointerRef.current;
      ptr.currentX += (ptr.targetX - ptr.currentX) * 0.08;
      ptr.currentY += (ptr.targetY - ptr.currentY) * 0.08;

      // Autonomous NASA gimbal rotation + interactive cursor tilt
      const yaw = Math.sin(elapsed * 0.75) * 0.24 + ptr.currentX * 0.38;
      const pitch = Math.cos(elapsed * 0.55) * 0.09 + ptr.currentY * 0.24 - 0.04;
      const roll = Math.sin(elapsed * 0.4) * 0.03;

      const cosY = Math.cos(yaw),
        sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch),
        sinP = Math.sin(pitch);
      const cosR = Math.cos(roll),
        sinR = Math.sin(roll);

      // Bi-directional horizontal green laser scanline position
      // Sweeps smoothly between top (10% height) and bottom (90% height)
      const cyclePeriod = 4.6; // seconds per full down-up cycle
      const phase = (elapsed % cyclePeriod) / cyclePeriod; // 0..1
      // Harmonic cosine easing for realistic scanner deceleration at turnaround points
      const scanNormalized = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2); // 0 -> 1 -> 0
      const scanDirection = phase < 0.5 ? 1 : -1; // +1 going down, -1 going up

      const scanMarginY = height * 0.1;
      const scanY = scanMarginY + scanNormalized * (height - scanMarginY * 2);
      const scanV = -1 + scanNormalized * 2; // Maps to anatomical v in [-1, 1]
      const laserBandPx = 38 * baseScale; // Vertical proximity threshold for emerald ignition

      // Clear main viewport
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Subtle NASA Orbital Gimbal Rings Behind Face Mesh
      ctx.save();
      ctx.strokeStyle = "rgba(51, 149, 255, 0.11)";
      ctx.lineWidth = 1;
      const ringRadius1 = Math.min(width, height) * 0.41;
      const ringRadius2 = Math.min(width, height) * 0.46;

      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius1, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius2, elapsed * 0.15, elapsed * 0.15 + Math.PI * 1.65);
      ctx.stroke();
      ctx.setLineDash([]);

      // Gimbal crosshair ticks
      ctx.strokeStyle = "rgba(51, 149, 255, 0.22)";
      for (let a = 0; a < 12; a++) {
        const ang = (a * Math.PI) / 6 + elapsed * 0.05;
        const rIn = ringRadius1 - 4;
        const rOut = ringRadius1 + 4;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(ang) * rIn, centerY + Math.sin(ang) * rIn);
        ctx.lineTo(centerX + Math.cos(ang) * rOut, centerY + Math.sin(ang) * rOut);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Project 3D Face Mesh Vertices & Calculate Green Laser Ignition
      const projected = new Array(mesh.vertices.length);
      let ignitedNodeCount = 0;

      for (let i = 0; i < mesh.vertices.length; i++) {
        const vtx = mesh.vertices[i];

        // Estimate screen Y first to compute subtle 3D Z-pulse when green laser intersects
        const approxY = centerY + vtx.y * baseScale;
        const distFromLaser = Math.abs(approxY - scanY);
        const ignition = Math.max(0, 1 - distFromLaser / laserBandPx);
        const smoothIgnition = ignition * ignition * (3 - 2 * ignition); // Smoothstep

        if (smoothIgnition > 0.25) ignitedNodeCount++;

        // Push vertex slightly outward along Z when ignited by green laser
        const zPulse = vtx.z + smoothIgnition * 6.5;

        // 3D Rotation: Yaw (Y) -> Pitch (X) -> Roll (Z)
        const x1 = vtx.x * cosY + zPulse * sinY;
        const z1 = -vtx.x * sinY + zPulse * cosY;

        const y2 = vtx.y * cosP - z1 * sinP;
        const z2 = vtx.y * sinP + z1 * cosP;

        const x3 = x1 * cosR - y2 * sinR;
        const y3 = x1 * sinR + y2 * cosR;

        // Perspective projection
        const fov = 540;
        const persp = fov / (fov - z2 * baseScale);
        const sx = centerX + x3 * baseScale * persp;
        const sy = centerY + y3 * baseScale * persp;

        // Exact screen-space laser proximity
        const exactDist = Math.abs(sy - scanY);
        const exactIgnition = Math.max(0, 1 - exactDist / laserBandPx);

        projected[i] = {
          sx,
          sy,
          z2,
          persp,
          ignition: exactIgnition,
          vtx,
        };
      }

      const currentMode = modeRef.current;

      // 3. Render Holographic Triangle Shaders Inside Active Green Scan Band
      if (currentMode !== "points") {
        for (let t = 0; t < mesh.triangles.length; t++) {
          const [i0, i1, i2] = mesh.triangles[t];
          const p0 = projected[i0];
          const p1 = projected[i1];
          const p2 = projected[i2];

          const triIgnition = (p0.ignition + p1.ignition + p2.ignition) / 3;
          if (triIgnition > 0.08) {
            ctx.beginPath();
            ctx.moveTo(p0.sx, p0.sy);
            ctx.lineTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.closePath();
            ctx.fillStyle = `rgba(16, 185, 129, ${(triIgnition * 0.22).toFixed(3)})`;
            ctx.fill();
          }
        }
      }

      // 4. Render Wireframe / Lidar Contour Edges
      if (currentMode !== "points") {
        for (let e = 0; e < mesh.edges.length; e++) {
          const edge = mesh.edges[e];
          if (currentMode === "lidar" && !edge.isContour) continue;

          const pA = projected[edge.a];
          const pB = projected[edge.b];

          const edgeIgnition = Math.max(pA.ignition, pB.ignition);
          const depthFactor = Math.max(0.2, Math.min(1, (pA.z2 + pB.z2 + 120) / 220));

          ctx.beginPath();
          ctx.moveTo(pA.sx, pA.sy);
          ctx.lineTo(pB.sx, pB.sy);

          if (edgeIgnition > 0.05) {
            // Interpolate from telemetry blue to high-luminance emerald green (#10B981 / #34D399)
            const r = Math.round(51 * (1 - edgeIgnition) + 52 * edgeIgnition);
            const g = Math.round(149 * (1 - edgeIgnition) + 235 * edgeIgnition);
            const b = Math.round(255 * (1 - edgeIgnition) + 153 * edgeIgnition);
            const alpha = Math.min(1, 0.28 * depthFactor + edgeIgnition * 0.78);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
            ctx.lineWidth = edge.isContour && currentMode === "lidar" ? 1.7 : 0.8 + edgeIgnition * 1.1;
          } else {
            const baseAlpha =
              currentMode === "lidar" ? 0.42 * depthFactor : 0.22 * depthFactor;
            ctx.strokeStyle = `rgba(51, 149, 255, ${baseAlpha.toFixed(3)})`;
            ctx.lineWidth = currentMode === "lidar" ? 1.25 : 0.75;
          }
          ctx.stroke();
        }
      }

      // 5. Render 3D Biometric Landmark Vertices (Nodes)
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const ig = p.ignition;
        const depthAlpha = Math.max(0.25, Math.min(1, (p.z2 + 110) / 200));

        if (currentMode === "lidar" && !p.vtx.isFeatureNode && ig < 0.2) continue;

        const baseRadius =
          currentMode === "points"
            ? p.vtx.isFeatureNode
              ? 2.1
              : 1.4
            : p.vtx.isFeatureNode
            ? 1.7
            : 1.0;
        const radius = (baseRadius + ig * 2.1) * Math.max(0.8, baseScale);

        if (ig > 0.08) {
          // Outer emerald glow halo for scanned nodes
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, radius * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(16, 185, 129, ${(ig * 0.34).toFixed(3)})`;
          ctx.fill();

          // Core emerald-white hot node
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, radius, 0, Math.PI * 2);
          ctx.fillStyle = ig > 0.65 ? "#A7F3D0" : "#10B981";
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, radius, 0, Math.PI * 2);
          ctx.fillStyle = p.vtx.isFeatureNode
            ? `rgba(112, 181, 255, ${(0.65 * depthAlpha).toFixed(3)})`
            : `rgba(51, 149, 255, ${(0.35 * depthAlpha).toFixed(3)})`;
          ctx.fill();
        }
      }

      // 6. Render Dynamic 3D Anatomical Callout Pins & Leader Lines
      ctx.save();
      ctx.font = "600 10px monospace";
      mesh.landmarks.forEach((lm) => {
        const pt = projected[lm.vertexIdx];
        if (!pt) return;
        const isLocked = pt.ignition > 0.22;

        const dir = lm.side === "left" ? -1 : 1;
        const elbowX = pt.sx + dir * (28 * baseScale);
        const elbowY = pt.sy - 10 * baseScale;
        const endX =
          lm.side === "left"
            ? Math.max(14, Math.min(pt.sx - 42 * baseScale, width * 0.24))
            : Math.min(width - 14, Math.max(pt.sx + 42 * baseScale, width * 0.76));

        // Leader line
        ctx.beginPath();
        ctx.moveTo(pt.sx, pt.sy);
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(endX, elbowY);
        ctx.strokeStyle = isLocked
          ? "rgba(52, 211, 153, 0.9)"
          : "rgba(51, 149, 255, 0.32)";
        ctx.lineWidth = isLocked ? 1.3 : 0.85;
        ctx.stroke();

        // Target reticle around anatomical anchor
        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, isLocked ? 5.5 : 3.2, 0, Math.PI * 2);
        ctx.strokeStyle = isLocked ? "#34D399" : "rgba(51, 149, 255, 0.55)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Callout text only on wider viewports or when actively locked
        if (width >= 360) {
          ctx.fillStyle = isLocked ? "#6EE7B7" : "rgba(148, 163, 184, 0.75)";
          ctx.textAlign = lm.side === "left" ? "left" : "right";
          ctx.fillText(lm.label, endX, elbowY - 4);

          ctx.fillStyle = isLocked ? "#10B981" : "rgba(51, 149, 255, 0.65)";
          ctx.fillText(isLocked ? `LOCKED • ${lm.metric}` : lm.metric, endX, elbowY + 10);
        }
      });
      ctx.restore();

      // 7. Render the Horizontal Green Laser Beam & Directional Phosphor Wake
      ctx.save();
      const wakeHeight = 56 * baseScale;
      const wakeTop = scanDirection > 0 ? scanY - wakeHeight : scanY;
      const wakeBottom = scanDirection > 0 ? scanY : scanY + wakeHeight;

      const wakeGrad = ctx.createLinearGradient(0, wakeTop, 0, wakeBottom);
      if (scanDirection > 0) {
        // Scanning downward: phosphor trail fades upward behind the beam
        wakeGrad.addColorStop(0, "rgba(16, 185, 129, 0)");
        wakeGrad.addColorStop(0.7, "rgba(16, 185, 129, 0.08)");
        wakeGrad.addColorStop(1, "rgba(16, 185, 129, 0.28)");
      } else {
        // Scanning upward: phosphor trail fades downward behind the beam
        wakeGrad.addColorStop(0, "rgba(16, 185, 129, 0.28)");
        wakeGrad.addColorStop(0.3, "rgba(16, 185, 129, 0.08)");
        wakeGrad.addColorStop(1, "rgba(16, 185, 129, 0)");
      }
      ctx.fillStyle = wakeGrad;
      ctx.fillRect(12, Math.min(wakeTop, wakeBottom), width - 24, wakeHeight);

      // Horizontal Green Laser Outer Bloom
      const beamGrad = ctx.createLinearGradient(0, scanY, width, scanY);
      beamGrad.addColorStop(0, "rgba(16, 185, 129, 0.05)");
      beamGrad.addColorStop(0.12, "rgba(16, 185, 129, 0.85)");
      beamGrad.addColorStop(0.5, "rgba(167, 243, 208, 1)");
      beamGrad.addColorStop(0.88, "rgba(16, 185, 129, 0.85)");
      beamGrad.addColorStop(1, "rgba(16, 185, 129, 0.05)");

      ctx.shadowColor = "#10B981";
      ctx.shadowBlur = 16;
      ctx.strokeStyle = beamGrad;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(8, scanY);
      ctx.lineTo(width - 8, scanY);
      ctx.stroke();

      // Left & Right Laser Caret Brackets + Live Y-Slice Readout on the Beam
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#10B981";
      // Left caret
      ctx.beginPath();
      ctx.moveTo(6, scanY - 5);
      ctx.lineTo(14, scanY);
      ctx.lineTo(6, scanY + 5);
      ctx.closePath();
      ctx.fill();

      // Right caret
      ctx.beginPath();
      ctx.moveTo(width - 6, scanY - 5);
      ctx.lineTo(width - 14, scanY);
      ctx.lineTo(width - 6, scanY + 5);
      ctx.closePath();
      ctx.fill();

      // Live Laser Pill Tag on Right Edge
      const yMillimeters = (-scanV * 95).toFixed(1);
      const pillText = `SCAN Y: ${yMillimeters > 0 ? `+${yMillimeters}` : yMillimeters}mm`;
      ctx.font = "bold 10px monospace";
      const pillWidth = ctx.measureText(pillText).width + 12;
      const pillX = width - pillWidth - 18;
      const pillY = Math.max(18, Math.min(height - 26, scanY - 18));

      ctx.fillStyle = "rgba(5, 11, 22, 0.88)";
      ctx.strokeStyle = "rgba(16, 185, 129, 0.75)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, 16, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#34D399";
      ctx.textAlign = "left";
      ctx.fillText(pillText, pillX + 6, pillY + 11.5);
      ctx.restore();

      // 8. Vertical Elevation Scale Ruler on Left Side
      ctx.save();
      ctx.strokeStyle = "rgba(51, 149, 255, 0.25)";
      ctx.lineWidth = 1;
      for (let tick = 0; tick <= 20; tick++) {
        const ty = scanMarginY + (tick / 20) * (height - scanMarginY * 2);
        const isMajor = tick % 5 === 0;
        const tickLen = isMajor ? 8 : 4;
        ctx.beginPath();
        ctx.moveTo(4, ty);
        ctx.lineTo(4 + tickLen, ty);
        ctx.stroke();
      }
      ctx.restore();

      // 9. Render Bottom Lidar Cross-Sectional Z-Depth Waveform Canvas
      const wWidth = waveCanvas.clientWidth;
      const wHeight = waveCanvas.clientHeight;
      waveCtx.clearRect(0, 0, wWidth, wHeight);

      // Find the row closest to the current laser scanV
      const activeRowIdx = Math.min(
        mesh.rows - 1,
        Math.max(0, Math.round(((scanV + 1) / 2) * (mesh.rows - 1)))
      );
      const rowIndices = mesh.gridIndices[activeRowIdx];

      // Draw baseline grid in waveform box
      waveCtx.strokeStyle = "rgba(51, 149, 255, 0.14)";
      waveCtx.lineWidth = 1;
      waveCtx.beginPath();
      waveCtx.moveTo(0, wHeight * 0.55);
      waveCtx.lineTo(wWidth, wHeight * 0.55);
      waveCtx.stroke();

      // Plot cross-sectional Z-depth curvature along the horizontal laser slice
      waveCtx.beginPath();
      for (let c = 0; c < rowIndices.length; c++) {
        const vtx = mesh.vertices[rowIndices[c]];
        const wx = (c / (rowIndices.length - 1)) * (wWidth - 16) + 8;
        const normalizedZ = Math.max(0, Math.min(1, (vtx.z + 20) / 115));
        const wy =
          wHeight - 6 - normalizedZ * (wHeight - 14) + Math.sin(elapsed * 8 + c) * 0.8;

        if (c === 0) waveCtx.moveTo(wx, wy);
        else waveCtx.lineTo(wx, wy);
      }
      waveCtx.strokeStyle = "#10B981";
      waveCtx.lineWidth = 2;
      waveCtx.shadowColor = "#10B981";
      waveCtx.shadowBlur = 8;
      waveCtx.stroke();

      // Fill area under Z-depth waveform
      waveCtx.lineTo(wWidth - 8, wHeight);
      waveCtx.lineTo(8, wHeight);
      waveCtx.closePath();
      const waveFill = waveCtx.createLinearGradient(0, 0, 0, wHeight);
      waveFill.addColorStop(0, "rgba(16, 185, 129, 0.32)");
      waveFill.addColorStop(1, "rgba(16, 185, 129, 0.0)");
      waveCtx.fillStyle = waveFill;
      waveCtx.shadowBlur = 0;
      waveCtx.fill();

      // Update React HUD state at ~10Hz for crisp telemetry counters without overhead
      if (now - lastTelemetryUpdate > 110) {
        lastTelemetryUpdate = now;
        const foundZone =
          BIOMETRIC_ZONES.find((z) => scanV >= z.range[0] && scanV <= z.range[1])?.id ||
          "OCULAR";
        setActiveZone(foundZone);

        const hexSuffix = Math.floor(1000 + ((scanNormalized * 8999) % 8999))
          .toString(16)
          .toUpperCase();
        setTelemetryReadout({
          scanYmm: yMillimeters > 0 ? `+${yMillimeters}` : `${yMillimeters}`,
          direction: scanDirection > 0 ? "DESCENDING ▼" : "ASCENDING ▲",
          activeNodes: ignitedNodeCount,
          vectorHash: `0x8F4E...${hexSuffix}`,
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handlePointerMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    pointerRef.current.targetX = Math.max(-1, Math.min(1, nx));
    pointerRef.current.targetY = Math.max(-1, Math.min(1, ny));
  };

  const handlePointerLeave = () => {
    pointerRef.current.targetX = 0;
    pointerRef.current.targetY = 0;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      className="relative rounded-2xl bg-obsidian-950 border border-obsidian-700 shadow-[0_28px_70px_-15px_rgba(0,41,87,0.55)] overflow-hidden text-slate-100 select-none"
    >
      {/* Top NASA Mission Control HUD Bar */}
      <div className="px-3.5 sm:px-4 py-3 bg-obsidian-900/95 border-b border-obsidian-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981] shrink-0" />
          <span
            className={`${jetbrainsMono.className} text-[10px] sm:text-[11px] text-emerald-300 font-semibold tracking-wider truncate`}
          >
            BIOMETRIC_MESH // 468-NODE LIDAR SCANNER
          </span>
        </div>

        {/* Interactive 3-Mode Topology Switcher */}
        <div className="flex items-center bg-obsidian-950 p-1 rounded-lg border border-obsidian-700 text-[11px] font-sans overflow-x-auto no-scrollbar">
          {[
            { id: "wireframe", label: "3D Wireframe" },
            { id: "lidar", label: "Lidar Contours" },
            { id: "points", label: "Point Cloud" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRenderMode(tab.id)}
              className={`flex-1 sm:flex-initial shrink-0 px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                renderMode === tab.id
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Face Mesh & Horizontal Green Laser Viewport */}
      <div className="relative h-[340px] sm:h-[360px] bg-vision-grid-dark overflow-hidden">
        {/* Ambient Emerald & Telemetry Blue Backlight */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.09),rgba(0,123,255,0.06)_45%,transparent_75%)]" />

        {/* Corner Precision Reticle Brackets */}
        <div className="pointer-events-none absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-emerald-400/60 rounded-tl-sm z-10" />
        <div className="pointer-events-none absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-emerald-400/60 rounded-tr-sm z-10" />
        <div className="pointer-events-none absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-emerald-400/60 rounded-bl-sm z-10" />
        <div className="pointer-events-none absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-emerald-400/60 rounded-br-sm z-10" />

        {/* Top Floating Telemetry Overlay */}
        <div className="pointer-events-none absolute top-3.5 inset-x-5 flex items-center justify-between text-[10px] sm:text-[11px] z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-obsidian-950/85 border border-obsidian-700 text-emerald-300 backdrop-blur-md">
            <ViewfinderCircleIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className={jetbrainsMono.className}>
              LASER: {telemetryReadout.direction}
            </span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-obsidian-950/85 border border-obsidian-700 text-blue-300 backdrop-blur-md">
            <CpuChipIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className={jetbrainsMono.className}>
              IGNITED NODES: {telemetryReadout.activeNodes}
            </span>
          </div>
        </div>

        {/* Interactive 60fps 3D Face Mesh Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-grab active:cursor-grabbing"
          aria-label="Interactive 3D Biometric Face Mesh with Horizontal Green Laser Scanner"
        />

        {/* Bottom Viewport Status Overlay */}
        <div className="pointer-events-none absolute bottom-3 inset-x-5 flex items-center justify-between text-[10px] text-slate-400 z-10">
          <span
            className={`${jetbrainsMono.className} px-2 py-0.5 rounded bg-obsidian-950/80 border border-obsidian-700/80 text-slate-300`}
          >
            VEC_HASH: {telemetryReadout.vectorHash}
          </span>
          <span
            className={`${jetbrainsMono.className} px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300`}
          >
            3D LIVENESS: 99.94% VERIFIED
          </span>
        </div>
      </div>

      {/* Bottom NASA Telemetry Deck: Live Z-Depth Waveform + 5-Zone Biometric Lock */}
      <div className="p-3.5 sm:p-4 bg-obsidian-900 border-t border-obsidian-700 space-y-3">
        {/* Live Z-Depth Cross-Section Oscilloscope Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          <div className="sm:col-span-5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5">
              <SparklesIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span
                className={`${jetbrainsMono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-300`}
              >
                Z-Depth Lidar Slice Profile
              </span>
            </div>
            <p
              className={`${jetbrainsMono.className} text-[10px] text-slate-400 mt-0.5`}
            >
              ELEVATION @ Y={telemetryReadout.scanYmm}mm • ZONE:{" "}
              <span className="text-white font-semibold">{activeZone}</span>
            </p>
          </div>

          <div className="sm:col-span-7 h-10 rounded-lg bg-obsidian-950 border border-obsidian-700 px-2 py-1 relative overflow-hidden">
            <canvas
              ref={waveformCanvasRef}
              className="w-full h-full block"
              aria-label="Live Z-Depth Cross-Sectional Elevation Waveform"
            />
          </div>
        </div>

        {/* Sequential 5-Zone Biometric Lock Indicators */}
        <div className="grid grid-cols-5 gap-1.5">
          {BIOMETRIC_ZONES.map((z) => {
            const isCurrent = activeZone === z.id;
            return (
              <div
                key={z.id}
                className={`px-2 py-1.5 rounded-lg border text-center transition-all duration-200 ${
                  isCurrent
                    ? "bg-emerald-500/20 border-emerald-400/70 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                    : "bg-obsidian-950/90 border-obsidian-700/80 text-slate-400"
                }`}
              >
                <p
                  className={`${jetbrainsMono.className} text-[9px] sm:text-[10px] font-bold truncate`}
                >
                  {z.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Collection & CoursePass Webhook Footer */}
        <div className="pt-2 border-t border-obsidian-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-[11px] text-slate-400">
          <span className={`${jetbrainsMono.className} truncate`}>
            COLLECTION: facepass_course_get201
          </span>
          <span
            className={`${jetbrainsMono.className} inline-flex items-center gap-1 text-emerald-400 truncate`}
          >
            <ShieldCheckIcon className="w-3.5 h-3.5 shrink-0" />
            COURSEPASS WEBHOOK: DISPATCHED (200 OK)
          </span>
        </div>
      </div>
    </div>
  );
}
