import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";

/**
 * EquationPlotter – generates points for equations based on the visible canvas area.
 */
function EquationPlotter({
  mode,
  equation,
  parametric,
  implicit,
  resolution,
  view, // { xMin, xMax, yMin, yMax }
}) {
  const points = [];
  const { xMin, xMax, yMin, yMax } = view;

  try {
    if (mode === "1d" && typeof equation === "function") {
      const step = (xMax - xMin) / (resolution * (xMax - xMin));
      for (let x = xMin; x <= xMax; x += step) {
        const y = equation(x);
        if (Number.isFinite(y)) {
          points.push({ x, y });
        }
      }
    } else if (mode === "parametric" && typeof parametric === "function") {
      const tRange = Math.PI * 4;
      const step = tRange / (resolution * 100);
      for (let t = -tRange; t <= tRange; t += step) {
        const result = parametric(t);
        if (result && Number.isFinite(result.x) && Number.isFinite(result.y)) {
          points.push({ x: result.x, y: result.y });
        }
      }
    } else if (mode === "implicit" && typeof implicit === "function") {
      const stepX = (xMax - xMin) / (resolution * 20);
      const stepY = (yMax - yMin) / (resolution * 20);
      const tolerance = 0.1;
      for (let x = xMin; x <= xMax; x += stepX) {
        for (let y = yMin; y <= yMax; y += stepY) {
          const value = implicit(x, y);
          if (Math.abs(value) < tolerance) {
            points.push({ x, y });
          }
        }
      }
    } else {
      const step = (xMax - xMin) / (resolution * (xMax - xMin));
      for (let x = xMin; x <= xMax; x += step) {
        points.push({ x, y: Math.sin(x) });
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
 * Controls component
 */
function Controls({
  speed,
  setSpeed,
  zoom,
  setZoom,
  mode,
  setMode,
  showGrid,
  setShowGrid,
  showLabels,
  setShowLabels,
  onPlay,
  onPause,
  onReset,
  onResetView,
}) {
  return (
    <div className="card bg-base-100 shadow-xl p-6 w-full max-w-2xl mx-auto space-y-6">
      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={onPlay} className="btn btn-success btn-sm">
          ▶ Play
        </button>
        <button onClick={onPause} className="btn btn-warning btn-sm">
          ⏸ Pause
        </button>
        <button onClick={onReset} className="btn btn-error btn-sm">
          ⏹ Reset
        </button>
        <button onClick={onResetView} className="btn btn-info btn-sm">
          🔄 Reset View
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="form-control">
          <label className="label text-sm font-medium">
            <span>Speed: {speed.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="range range-success"
          />
        </div>
        <div className="form-control">
          <label className="label text-sm font-medium">
            <span>Zoom: {zoom.toFixed(1)}x</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="range range-info"
          />
        </div>
        <div className="form-control">
          <label className="label text-sm font-medium">
            <span>Mode</span>
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="1d">1D Function</option>
            <option value="parametric">Parametric</option>
            <option value="implicit">Implicit</option>
          </select>
        </div>
      </div>
      <div className="flex gap-6 justify-center">
        <label className="label cursor-pointer gap-2">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
            className="checkbox checkbox-sm"
          />
          <span className="label-text">Grid</span>
        </label>
        <label className="label cursor-pointer gap-2">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
            className="checkbox checkbox-sm"
          />
          <span className="label-text">Labels</span>
        </label>
      </div>
    </div>
  );
}

/**
 * Main EnhancedDrawingCanvas
 */
export default function EnhancedDrawingCanvas({
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
  showGrid = true,
  showLabels = true,
}) {
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

  const [currentMode, setCurrentMode] = useState(mode);
  const [speed, setSpeed] = useState(2);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showGridState, setShowGridState] = useState(showGrid);
  const [showLabelsState, setShowLabelsState] = useState(showLabels);

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
    const view = {
      xMin: toWorldCoords(0, 0).x,
      xMax: toWorldCoords(width, 0).x,
      yMin: toWorldCoords(0, height).y,
      yMax: toWorldCoords(0, 0).y,
    };
    return EquationPlotter({
      mode: currentMode,
      equation,
      parametric,
      implicit,
      resolution,
      view,
    });
  }, [
    currentMode,
    equation,
    parametric,
    implicit,
    resolution,
    toWorldCoords,
    width,
    height,
  ]);

  const drawScene = useCallback(
    (ctx) => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();

      const currentScale = scale * zoom;

      if (showGridState) {
        ctx.strokeStyle = "#eee";
        ctx.lineWidth = 1;

        const origin = toCanvasCoords(0, 0);

        const xStep = 1;
        const startX = Math.floor(toWorldCoords(0, 0).x / xStep) * xStep;
        const endX = Math.ceil(toWorldCoords(width, 0).x / xStep) * xStep;

        for (let x = startX; x <= endX; x += xStep) {
          const cx = toCanvasCoords(x, 0).x;
          ctx.beginPath();
          ctx.moveTo(cx, 0);
          ctx.lineTo(cx, height);
          ctx.stroke();
        }

        const yStep = 1;
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

      ctx.strokeStyle = "#888";
      ctx.lineWidth = 1.5;
      const origin = toCanvasCoords(0, 0);
      ctx.beginPath();
      ctx.moveTo(0, origin.y);
      ctx.lineTo(width, origin.y);
      ctx.moveTo(origin.x, 0);
      ctx.lineTo(origin.x, height);
      ctx.stroke();

      if (showLabelsState) {
        ctx.fillStyle = "#555";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const xStep = Math.ceil(50 / currentScale);
        const startX = Math.floor(toWorldCoords(0, 0).x / xStep) * xStep;
        const endX = Math.ceil(toWorldCoords(width, 0).x / xStep) * xStep;
        for (let x = startX; x <= endX; x += xStep) {
          if (x !== 0) ctx.fillText(x, toCanvasCoords(x, 0).x, origin.y + 5);
        }

        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        const yStep = Math.ceil(50 / currentScale);
        const startY = Math.floor(toWorldCoords(0, height).y / yStep) * yStep;
        const endY = Math.ceil(toWorldCoords(0, 0).y / yStep) * yStep;
        for (let y = startY; y <= endY; y += yStep) {
          if (y !== 0) ctx.fillText(y, origin.x - 5, toCanvasCoords(0, y).y);
        }
        ctx.fillText("0", origin.x - 5, origin.y + 15);
      }

      const pts = points.map((p) => toCanvasCoords(p.x, p.y));
      ctx.strokeStyle = `rgba(52, 152, 219, ${pathAlphaRef.current})`;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (pts.length > 1) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);

        const pathEndIndex =
          statusRef.current === "drawing"
            ? Math.floor(progressRef.current)
            : pts.length - 1;

        for (let i = 1; i <= pathEndIndex && i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
      }

      Sprite({
        ctx,
        pts,
        progress: progressRef.current,
        alpha: spriteAlphaRef.current,
        sprite: spriteImgRef.current,
      });

      ctx.restore();
    },
    [width, height, points, toCanvasCoords, showGridState, showLabelsState],
  );

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

  const startAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    runningRef.current = true;
    lastTimeRef.current = performance.now();

    const ctx = canvasRef.current.getContext("2d");

    const animate = (timestamp) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (runningRef.current) {
        const pts = points;
        if (pts && pts.length > 0) {
          const progressSpeed = (speed * 50 * deltaTime) / 1000;

          if (statusRef.current === "drawing") {
            progressRef.current += progressSpeed;
            if (progressRef.current >= pts.length - 1) {
              progressRef.current = pts.length - 1;
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

            spriteAlphaRef.current = currentAlpha;
            pathAlphaRef.current = currentAlpha;

            if (currentAlpha <= 0) {
              handleReset();
            }
          }
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
    progressRef.current = 0;
    spriteAlphaRef.current = 1;
    pathAlphaRef.current = 1;
    statusRef.current = "drawing";
    completionTimestampRef.current = null;
    startAnimation();
  }, [points, startAnimation]);

  const handleMouseDown = useCallback((e) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging.current) return;
      const dx = (e.clientX - lastMousePos.current.x) / (scale * zoom);
      const dy = (e.clientY - lastMousePos.current.y) / (scale * zoom);
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y - dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    },
    [zoom, scale],
  );

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = 0.1;
      const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
      const newZoom = Math.min(Math.max(0.1, zoom + delta * zoom), 10);

      if (newZoom === zoom) return;

      const newOffsetX =
        offset.x - ((mouseX - width / 2) / scale) * (1 / zoom - 1 / newZoom);
      const newOffsetY =
        offset.y + ((mouseY - height / 2) / scale) * (1 / zoom - 1 / newZoom);

      setZoom(newZoom);
      setOffset({ x: newOffsetX, y: newOffsetY });
    },
    [zoom, offset.x, offset.y, width, height, scale],
  );

  const handlePlay = () => {
    runningRef.current = true;
  };
  const handlePause = () => (runningRef.current = false);

  const handleResetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="cursor-grab active:cursor-grabbing border-2 border-gray-300"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} width={width} height={height} />
      </div>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <Controls
          speed={speed}
          setSpeed={setSpeed}
          zoom={zoom}
          setZoom={setZoom}
          mode={currentMode}
          setMode={setCurrentMode}
          showGrid={showGridState}
          setShowGrid={setShowGridState}
          showLabels={showLabelsState}
          setShowLabels={setShowLabelsState}
          onPlay={handlePlay}
          onPause={handlePause}
          onReset={handleReset}
          onResetView={handleResetView}
        />
      </div>
    </div>
  );
}
