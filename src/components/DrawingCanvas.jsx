import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Settings, Play, Pause, RefreshCw, Minimize } from "lucide-react";
import { mulberry32 } from "../utils/rng";

// --- HELPER COMPONENTS AND FUNCTIONS ---

/**
 * Calculates an adaptive grid step size to prevent visual clutter.
 * @param {number} currentScale - The current scale of the canvas (scale * zoom).
 * @returns {number} An appropriate step size for the grid lines.
 */
const calculateAdaptiveGridStep = (currentScale) => {
  const desiredPixelSpacing = 60; // Aim for grid lines ~60px apart
  const minUnitsPerLine = desiredPixelSpacing / currentScale;
  const magnitude = Math.pow(10, Math.floor(Math.log10(minUnitsPerLine)));
  const residual = minUnitsPerLine / magnitude;

  if (residual > 5) {
    return 10 * magnitude;
  } else if (residual > 2) {
    return 5 * magnitude;
  } else {
    return 2 * magnitude;
  }
};

/**
 * EquationPlotter – generates points for equations.
 */
function EquationPlotter({
  mode,
  equation,
  parametric,
  implicit,
  resolution,
  view,
}) {
  const points = [];
  const { xMin, xMax, yMin, yMax } = view;
  try {
    if (mode === "fractal" && typeof equation === "function") {
      const tStep = (Math.PI * 2) / (resolution * 20);
      for (let t = 0; t < Math.PI * 2; t += tStep) {
        points.push(...equation(t));
      }
    } else if (mode === "1d" && typeof equation === "function") {
      const step = 1 / resolution;
      for (let x = xMin; x <= xMax; x += step) {
        const y = equation(x);
        if (Number.isFinite(y)) {
          points.push({ x, y });
        }
      }
    } else if (mode === "parametric" && typeof parametric === "function") {
      const tRange = Math.PI * 2;
      const numPoints = resolution * 200;
      const step = (tRange * 2) / numPoints;
      for (let t = -tRange; t <= tRange; t += step) {
        const result = parametric(t);
        if (result && Number.isFinite(result.x) && Number.isFinite(result.y)) {
          points.push({ x: result.x, y: result.y });
        }
      }
    } else if (mode === "implicit" && typeof implicit === "function") {
      const numSteps = resolution * 15;
      const stepX = (xMax - xMin) / numSteps;
      const stepY = (yMax - yMin) / numSteps;
      const tolerance = 0.1;
      for (let x = xMin; x <= xMax; x += stepX) {
        for (let y = yMin; y <= yMax; y += stepY) {
          const value = implicit(x, y);
          if (Math.abs(value) < tolerance) {
            points.push({ x, y });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error generating points:", err);
  }
  return points;
}

/**
 * Sprite – draws sprite along the path.
 */
function Sprite({ ctx, pts, progress, alpha, sprite }) {
  if (!Array.isArray(pts) || pts.length === 0) return;
  const lastIndex = pts.length - 1;
  const safeProgress = Math.max(0, Math.min(progress, lastIndex));
  const currentIndex = Math.floor(safeProgress);
  const frac = safeProgress - currentIndex;
  let spriteX, spriteY;
  if (!pts[currentIndex]) return;
  if (currentIndex >= lastIndex) {
    spriteX = pts[lastIndex].x;
    spriteY = pts[lastIndex].y;
  } else {
    const current = pts[currentIndex] || pts[0];
    const next = pts[Math.min(currentIndex + 1, lastIndex)] || current;
    spriteX = current.x + (next.x - current.x) * frac;
    spriteY = current.y + (next.y - current.y) * frac;
  }
  let angle = 0;
  if (currentIndex > 0 && currentIndex < pts.length - 1) {
    const prev = pts[Math.max(0, currentIndex - 1)];
    const next = pts[Math.min(currentIndex + 1, lastIndex)];
    angle = Math.atan2(next.y - prev.y, next.x - prev.x);
  } else if (pts.length > 1) {
    angle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
  }
  const size = 24;
  if (sprite && sprite.complete) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(spriteX, spriteY);
    ctx.rotate(angle);
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    ctx.restore();
  } else {
    ctx.fillStyle = `rgba(255,0,0,${alpha})`;
    ctx.beginPath();
    ctx.arc(spriteX, spriteY, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * The Drawing Canvas Component
 */
export const DrawingCanvas = forwardRef(
  (
    {
      equation,
      parametric,
      implicit,
      spriteUrl,
      width = 800,
      height = 500,
      scale = 50,
      holdDuration = 1500,
      fadeDuration = 2000,
      mode = "1d",
      resolution = 50,
      speed = 2,
      zoom = 1,
      setZoom,
      showGrid = true,
      showLabels = true,
      ...props
    },
    ref,
  ) => {
    const canvasRef = useRef(null);
    const spriteImgRef = useRef(null);
    const animationRef = useRef(null);
    const progressRef = useRef(0);
    const runningRef = useRef(true);
    const statusRef = useRef("drawing");
    const completionTimestampRef = useRef(null);
    const lastTimeRef = useRef(performance.now());
    const spriteAlphaRef = useRef(1);
    const pathAlphaRef = useRef(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = spriteUrl;
      img.onload = () => {
        spriteImgRef.current = img;
      };
    }, [spriteUrl]);

    const toCanvasCoords = useCallback(
      (x, y) => ({
        x: width / 2 + (x + offset.x) * scale * zoom,
        y: height / 2 - (y + offset.y) * scale * zoom,
      }),
      [width, height, scale, zoom, offset],
    );

    const toWorldCoords = useCallback(
      (cx, cy) => ({
        x: (cx - width / 2) / (scale * zoom) - offset.x,
        y: (height / 2 - cy) / (scale * zoom) - offset.y,
      }),
      [width, height, scale, zoom, offset],
    );

    const points = useMemo(() => {
      const staticView = { xMin: -12, xMax: 12, yMin: -12, yMax: 12 };
      const generatedPoints = EquationPlotter({
        mode,
        equation,
        parametric,
        implicit,
        resolution,
        view: staticView,
      });
      if (mode === "fractal") {
        generatedPoints.sort((a, b) => b.depth - a.depth);
      }
      return generatedPoints;
    }, [mode, equation, parametric, implicit, resolution]);

    const pathSegments = useMemo(() => {
      if (!points || points.length === 0) return [];
      if (mode !== "fractal") {
        return [{ color: "52, 152, 219", points }];
      }
      const segments = [];
      const colors = [
        "255, 165, 0",
        "220, 20, 60",
        "255, 215, 0",
        "139, 0, 139",
        "0, 191, 255",
        "50, 205, 50",
      ];
      let colorIndex = 0;
      const rand = mulberry32(points.length);
      let pointsUntilChange = Math.floor(rand() * 400 + 200);
      let currentSegment = { color: colors[colorIndex], points: [] };
      for (const point of points) {
        currentSegment.points.push(point);
        pointsUntilChange--;
        if (pointsUntilChange <= 0) {
          segments.push(currentSegment);
          colorIndex = (colorIndex + 1) % colors.length;
          pointsUntilChange = Math.floor(rand() * 400 + 200);
          currentSegment = { color: colors[colorIndex], points: [] };
        }
      }
      if (currentSegment.points.length > 0) {
        segments.push(currentSegment);
      }
      return segments;
    }, [points, mode]);

    const handleReset = useCallback(() => {
      progressRef.current = 0;
      spriteAlphaRef.current = 1;
      pathAlphaRef.current = 1;
      statusRef.current = "drawing";
      completionTimestampRef.current = null;
      if (!runningRef.current) {
        runningRef.current = true;
      }
    }, []);

    const drawScene = useCallback(
      (ctx) => {
        ctx.clearRect(0, 0, width, height);
        ctx.save();

        const currentScale = scale * zoom;
        const gridStep = calculateAdaptiveGridStep(currentScale);
        if (showGrid) {
          ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
          ctx.lineWidth = 1;
          const xStep = gridStep;
          const startX = Math.floor(toWorldCoords(0, 0).x / xStep) * xStep;
          const endX = Math.ceil(toWorldCoords(width, 0).x / xStep) * xStep;
          for (let x = startX; x <= endX; x += xStep) {
            const cx = toCanvasCoords(x, 0).x;
            ctx.beginPath();
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, height);
            ctx.stroke();
          }
          const yStep = gridStep;
          const startY = Math.floor(toWorldCoords(0, height).y / yStep) * yStep;
          const endY = Math.ceil(toWorldCoords(0, 0).y / yStep) * yStep;
          for (let y = startY; y <= endY; y += yStep) {
            const cy = toCanvasCoords(0, y).y;
            ctx.beginPath();
            ctx.moveTo(0, cy);
            ctx.lineTo(width, cy);
            ctx.stroke();
          }
        }

        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        ctx.lineWidth = 1.5;
        const origin = toCanvasCoords(0, 0);
        ctx.beginPath();
        ctx.moveTo(0, origin.y);
        ctx.lineTo(width, origin.y);
        ctx.moveTo(origin.x, 0);
        ctx.lineTo(origin.x, height);
        ctx.stroke();

        if (showLabels) {
          ctx.fillStyle = "#555";
          ctx.font = "12px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          const labelStep = calculateAdaptiveGridStep(currentScale);

          const startXLabel =
            Math.floor(toWorldCoords(0, 0).x / labelStep) * labelStep;
          const endXLabel =
            Math.ceil(toWorldCoords(width, 0).x / labelStep) * labelStep;
          for (let x = startXLabel; x <= endXLabel; x += labelStep) {
            if (x !== 0)
              ctx.fillText(
                x.toPrecision(3),
                toCanvasCoords(x, 0).x,
                origin.y + 5,
              );
          }

          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
          const startYLabel =
            Math.floor(toWorldCoords(0, height).y / labelStep) * labelStep;
          const endYLabel =
            Math.ceil(toWorldCoords(0, 0).y / labelStep) * labelStep;
          for (let y = startYLabel; y <= endYLabel; y += labelStep) {
            if (y !== 0)
              ctx.fillText(
                y.toPrecision(3),
                origin.x - 5,
                toCanvasCoords(0, y).y,
              );
          }
          ctx.fillText("0", origin.x - 5, origin.y + 15);
        }

        let pointsToDraw =
          statusRef.current === "drawing"
            ? Math.floor(progressRef.current)
            : points.length;
        for (const segment of pathSegments) {
          if (pointsToDraw <= 0) break;
          const pointsInThisSegment = Math.min(
            segment.points.length,
            pointsToDraw,
          );
          const segmentPoints = segment.points.slice(0, pointsInThisSegment);
          if (segmentPoints.length < 2) {
            pointsToDraw -= segmentPoints.length;
            continue;
          }
          const pts = segmentPoints.map((p) => toCanvasCoords(p.x, p.y));
          ctx.strokeStyle = `rgba(${segment.color}, ${pathAlphaRef.current})`;
          ctx.lineWidth = mode === "fractal" ? 2 : 3;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.stroke();
          pointsToDraw -= segmentPoints.length;
        }
        const allCanvasPoints = points.map((p) => toCanvasCoords(p.x, p.y));
        Sprite({
          ctx,
          pts: allCanvasPoints,
          progress: progressRef.current,
          alpha: spriteAlphaRef.current,
          sprite: spriteImgRef.current,
        });
        ctx.restore();
      },
      [
        pathSegments,
        points,
        toCanvasCoords,
        toWorldCoords,
        mode,
        width,
        height,
        scale,
        zoom,
        showGrid,
        showLabels,
      ],
    );

    const startAnimation = useCallback(() => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      lastTimeRef.current = performance.now();
      const ctx = canvasRef.current.getContext("2d");
      const animate = (timestamp) => {
        const deltaTime = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;
        if (runningRef.current && points && points.length > 0) {
          const progressSpeed = (speed * 50 * deltaTime) / 1000;
          if (statusRef.current === "drawing") {
            progressRef.current += progressSpeed;
            if (progressRef.current >= points.length - 1) {
              progressRef.current = points.length - 1;
              statusRef.current = "holding";
              completionTimestampRef.current = timestamp;
            }
          } else if (statusRef.current === "holding") {
            if (timestamp - completionTimestampRef.current > holdDuration) {
              statusRef.current = "fading";
              completionTimestampRef.current = timestamp;
            }
          } else if (statusRef.current === "fading") {
            const elapsedFade = timestamp - completionTimestampRef.current;
            const currentAlpha = Math.max(0, 1 - elapsedFade / fadeDuration);
            spriteAlphaRef.current = pathAlphaRef.current = currentAlpha;
            if (currentAlpha <= 0) handleReset();
          }
        }
        drawScene(ctx);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }, [points, speed, holdDuration, fadeDuration, drawScene, handleReset]);

    useEffect(() => {
      startAnimation();
      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    }, [startAnimation]);

    useEffect(() => {
      handleReset();
    }, [points, handleReset]);

    const handleMouseDown = useCallback(
      (e) => {
        isDragging.current = true;
        const rect = canvasRef.current.getBoundingClientRect();
        lastMousePos.current = {
          x: (e.clientX - rect.left) * (width / rect.width),
          y: (e.clientY - rect.top) * (height / rect.height),
        };
      },
      [width, height],
    );
    const handleMouseUp = useCallback(() => {
      isDragging.current = false;
    }, []);
    const handleMouseMove = useCallback(
      (e) => {
        if (!isDragging.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const currentMouseX = (e.clientX - rect.left) * (width / rect.width);
        const currentMouseY = (e.clientY - rect.top) * (height / rect.height);

        const dx_canvas = currentMouseX - lastMousePos.current.x;
        const dy_canvas = currentMouseY - lastMousePos.current.y;

        const dx_world = dx_canvas / (scale * zoom);
        const dy_world = dy_canvas / (scale * zoom);

        setOffset((prev) => ({ x: prev.x + dx_world, y: prev.y - dy_world }));

        lastMousePos.current = { x: currentMouseX, y: currentMouseY };
      },
      [zoom, scale, width, height],
    );
    const handleWheel = useCallback(
      (e) => {
        e.preventDefault();
        if (typeof setZoom !== "function") return;
        const rect = canvasRef.current.getBoundingClientRect();

        // ✅ FIX: Scale mouse coordinates to match canvas resolution for accurate pivot point.
        const mouseX = (e.clientX - rect.left) * (width / rect.width);
        const mouseY = (e.clientY - rect.top) * (height / rect.height);

        const zoomFactor = 0.1;
        const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
        const newZoom = Math.min(Math.max(0.01, zoom + delta * zoom), 100);
        if (newZoom === zoom) return;

        const worldX = (mouseX - width / 2) / (scale * zoom) - offset.x;
        const worldY = (height / 2 - mouseY) / (scale * zoom) - offset.y;

        const newOffsetX = (mouseX - width / 2) / (scale * newZoom) - worldX;
        const newOffsetY = (height / 2 - mouseY) / (scale * newZoom) - worldY;

        setZoom(newZoom);
        setOffset({ x: newOffsetX, y: newOffsetY });
      },
      [zoom, setZoom, offset, width, height, scale],
    );

    useImperativeHandle(ref, () => ({
      play: () => {
        runningRef.current = true;
      },
      pause: () => {
        runningRef.current = false;
      },
      reset: handleReset,
      resetView: () => {
        if (typeof setZoom === "function") setZoom(1);
        setOffset({ x: 0, y: 0 });
      },
    }));

    return (
      <div
        className="w-full h-full flex cursor-grab active:cursor-grabbing rounded-lg overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        {...props}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-full bg-base-100"
        />
      </div>
    );
  },
);
