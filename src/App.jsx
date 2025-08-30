import React, { useState, useCallback, useRef } from "react";
import { DrawingCanvas } from "./components/DrawingCanvas";
import { Play, Pause, RefreshCw, Minimize, Settings } from "lucide-react";
import { mulberry32 } from "./utils/rng";
import { X } from "lucide-react";

/**
 * Control sliders and buttons for Pookalam parameters.
 */
function PookalamControls({
  params,
  setParams,
  onPlay,
  onPause,
  onReset,
  onResetView,
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setParams((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const controlData = [
    { name: "speed", min: 1, max: 20, step: 0.5, label: "Speed" },
    { name: "resolution", min: 5, max: 30, step: 1, label: "Resolution" },
    { name: "density", min: 10, max: 80, step: 1, label: "Density" },
    { name: "petals", min: 3, max: 12, step: 1, label: "Petals" },
    { name: "size", min: 4, max: 8, step: 0.1, label: "Size" },
    { name: "style", min: 1, max: 100, step: 1, label: "Style" },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-4 gap-2">
        <button onClick={onPlay} className="btn btn-success btn-sm">
          <Play size={16} className="shrink-0" /> Play
        </button>
        <button onClick={onPause} className="btn btn-warning btn-sm">
          <Pause size={16} className="shrink-0" /> Pause
        </button>
        <button onClick={onReset} className="btn btn-error btn-sm">
          <RefreshCw size={16} className="shrink-0" /> Reset
        </button>
        <button onClick={onResetView} className="btn btn-info btn-sm">
          <Minimize size={16} className="shrink-0" /> View
        </button>
      </div>
      <div className="divider"></div>
      {controlData.map(({ name, min, max, step, label }) => (
        <div className="form-control" key={name}>
          <label className="label">
            <span className="label-text font-semibold">
              {label}: {params[name].toFixed(name === "size" ? 1 : 0)}
            </span>
          </label>
          <input
            type="range"
            name={name}
            min={min}
            max={max}
            step={step}
            value={params[name]}
            onChange={handleChange}
            className="range range-primary range-sm"
          />
        </div>
      ))}
    </div>
  );
}
export default function App() {
  const [params, setParams] = useState({
    speed: 10,
    resolution: 15,
    density: 45,
    petals: 8,
    size: 6.0,
    style: 1,
  });

  const [zoom, setZoom] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const canvasRef = useRef(null);

  const finalPookalam = useCallback(
    (t) => {
      const points = [];
      const baseRadius = params.size;
      const numFillLayers = Math.floor(params.density);
      const mainPetals = Math.floor(params.petals);
      const rand = mulberry32(params.style);
      const outerAmp1 = 0.1 + rand() * 0.15;
      const outerAmp2 = 0.02 + rand() * 0.05;
      const outerRippleMult = 2 + Math.floor(rand() * 3);
      const midPetalShape = 4 + Math.floor(rand() * 4);
      const midPetalAmp = 0.2 + rand() * 0.3;
      const midPetalRot = rand() * Math.PI;
      const coreAmp = 0.15 + rand() * 0.2;
      const coreInversion = rand() > 0.5 ? 1 : -1;
      for (let i = 0; i < numFillLayers; i++) {
        const rScale = numFillLayers > 1 ? i / (numFillLayers - 1) : 1;
        const ringDepth = numFillLayers - i;
        const outerMaxRadius = baseRadius;
        const outerRippleFreq = mainPetals * outerRippleMult;
        const r_outer_outline =
          outerMaxRadius *
          (1 +
            outerAmp1 * Math.sin(mainPetals * t) +
            outerAmp2 * Math.cos(outerRippleFreq * t));
        const r_outer_scaled = r_outer_outline * rScale;
        points.push({
          x: r_outer_scaled * Math.cos(t),
          y: r_outer_scaled * Math.sin(t),
          depth: ringDepth,
        });
        const midRingPositionRadius = baseRadius * 0.6;
        const midPetalMaxRadius = baseRadius * 0.28;
        for (let j = 0; j < mainPetals; j++) {
          const petalAngle = (j / mainPetals) * Math.PI * 2;
          const petalCenterX = midRingPositionRadius * Math.cos(petalAngle);
          const petalCenterY = midRingPositionRadius * Math.sin(petalAngle);
          const r_mid_outline =
            midPetalMaxRadius * (1 + midPetalAmp * Math.cos(midPetalShape * t));
          const r_mid_scaled = r_mid_outline * rScale;
          const x_mid_local = r_mid_scaled * Math.cos(t + midPetalRot);
          const y_mid_local = r_mid_scaled * Math.sin(t + midPetalRot);
          points.push({
            x: petalCenterX + x_mid_local,
            y: petalCenterY + y_mid_local,
            depth: ringDepth + 1000,
          });
        }
        const coreMaxRadius = baseRadius * 0.35;
        const r_core_outline =
          coreMaxRadius *
          (1 -
            coreAmp * coreInversion * Math.sin(mainPetals * t + Math.PI / 2));
        const r_core_scaled = r_core_outline * rScale;
        points.push({
          x: r_core_scaled * Math.cos(t),
          y: r_core_scaled * Math.sin(t),
          depth: ringDepth + 2000,
        });
      }
      return points;
    },
    // FIXED: Dependency array only includes shape-defining parameters
    [params.density, params.petals, params.size, params.style],
  );

  const handlePlay = () => canvasRef.current?.play();
  const handlePause = () => canvasRef.current?.pause();
  const handleReset = () => canvasRef.current?.reset();
  const handleResetView = () => {
    setZoom(1);
    canvasRef.current?.resetView();
  };

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4 relative font-sans">
      <a
        href="https://github.com/alpha-og/autograph"
        target="_blank"
        rel="noreferrer"
        className="fixed top-5 right-5 z-30"
      >
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-base-100 border-2 border-primary shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
          {/* GitHub logo */}
          <img
            src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
            alt="GitHub"
            className="w-6 h-6 rounded-full"
          />

          {/* Text */}
          <span className="font-semibold text-base text-primary">
            Star on GitHub
          </span>

          {/* Stars count */}
          <img
            src="https://img.shields.io/github/stars/alpha-og/autograph?style=social"
            alt="GitHub Repo stars"
            className="h-6"
          />
        </div>
      </a>
      <div className="w-full max-w-5xl text-center mb-4">
        <h1 className="text-4xl font-bold">Pookalam AutoGraph</h1>
        <p className="text-base-content/70">
          This Onam make a Pookalam with TinkerHub
        </p>
      </div>
      <div className="card w-full max-w-5xl flex flex-row bg-base-100 shadow-xl overflow-hidden relative">
        <div className="flex-grow flex items-center justify-center p-4">
          <DrawingCanvas
            ref={canvasRef}
            equation={finalPookalam}
            mode="fractal"
            spriteUrl="/sprite.png"
            width={800}
            height={600}
            scale={45}
            resolution={params.resolution}
            speed={params.speed}
            zoom={zoom}
            setZoom={setZoom}
            className="w-full h-auto aspect-[4/3]"
          />
        </div>

        {/* Settings sidebar inside the card */}
        <div
          className={`
      absolute top-0 right-0 h-full w-80 bg-base-100/80 backdrop-blur-sm border-l border-base-300
      transform transition-transform duration-300 ease-in-out
      ${showControls ? "translate-x-0" : "translate-x-full"}
    `}
        >
          <div className="flex justify-between items-center p-4 border-b border-base-300">
            <h2 className="text-lg font-bold">Settings</h2>
            <button
              onClick={() => setShowControls(false)}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <X />
            </button>
          </div>
          <PookalamControls
            params={params}
            setParams={setParams}
            onPlay={handlePlay}
            onPause={handlePause}
            onReset={handleReset}
            onResetView={handleResetView}
          />
        </div>
      </div>
      <button
        onClick={() => setShowControls((prev) => !prev)}
        className="btn btn-secondary btn-circle fixed bottom-6 right-6 z-30 shadow-lg"
        aria-label="Toggle Settings"
      >
        <Settings />
      </button>
    </div>
  );
}
