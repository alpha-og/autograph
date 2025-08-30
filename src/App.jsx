import React, { useState, useRef, useMemo } from "react";
import { DrawingCanvas } from "./components/DrawingCanvas";
import {
  Play,
  Pause,
  RefreshCw,
  Minimize,
  Settings,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { finalPookalam, pookalamPresets } from "./utils/pookalam";

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
  const [selectedPreset, setSelectedPreset] = useState("traditional");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setParams((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const presets = [
    { key: "traditional", label: "Traditional" },
    { key: "ornate", label: "Ornate" },
    { key: "minimalist", label: "Minimalist" },
    { key: "organic", label: "Organic" },
  ];

  const controlData = [
    { name: "style", min: 1, max: 100, step: 1, label: "Style (Seed)" },
    { name: "speed", min: 1, max: 20, step: 0.5, label: "Speed" },
    { name: "resolution", min: 5, max: 30, step: 1, label: "Resolution" },
    { name: "density", min: 0.3, max: 1.0, step: 0.05, label: "Density" },
    { name: "petals", min: 4, max: 16, step: 1, label: "Petals" },
    { name: "size", min: 80, max: 120, step: 1, label: "Size" },
    { name: "complexity", min: 0.1, max: 1.0, step: 0.05, label: "Complexity" },
    { name: "symmetry", min: 0.5, max: 1.0, step: 0.05, label: "Symmetry" },
  ];

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full">
      {/* Preset Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {presets.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              setParams((prev) => ({
                ...prev,
                ...pookalamPresets[key],
                style: Math.floor(Math.random() * 100),
              }));
              setSelectedPreset(key);
            }}
            className={`btn btn-sm ${
              selectedPreset === key ? "btn-primary" : "btn-outline btn-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Play / Pause / Reset Controls */}
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

      {/* Sliders */}
      <div className="overflow-y-scroll">
        {controlData.map(({ name, min, max, step, label }) => (
          <div className="form-control" key={name}>
            <label className="label">
              <span className="label-text font-semibold">
                {label}:{" "}
                {params[name].toFixed(
                  name.match(/density|complexity|symmetry/) ? 2 : 0,
                )}
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
    </div>
  );
}

function ZoomControls({ onZoomIn, onZoomOut, onResetView }) {
  return (
    <div className="fixed bottom-24 right-6 z-30 flex flex-col gap-2">
      <button
        onClick={onZoomIn}
        className="btn btn-secondary btn-circle shadow-md hover:shadow-lg transition-all duration-300"
        aria-label="Zoom In"
      >
        <ZoomIn size={18} />
      </button>
      <button
        onClick={onZoomOut}
        className="btn btn-secondary btn-circle shadow-md hover:shadow-lg transition-all duration-300"
        aria-label="Zoom Out"
      >
        <ZoomOut size={18} />
      </button>
      <button
        onClick={onResetView}
        className="btn btn-secondary btn-circle shadow-md hover:shadow-lg transition-all duration-300"
        aria-label="Reset View"
      >
        <Minimize size={18} />
      </button>
    </div>
  );
}

export default function App() {
  const [params, setParams] = useState({
    speed: 2,
    resolution: 10,
    ...pookalamPresets.traditional,
  });

  const [zoom, setZoom] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const canvasRef = useRef(null);

  const equation = useMemo(
    () => finalPookalam(params),
    [
      params.size,
      params.density,
      params.petals,
      params.style,
      params.complexity,
      params.symmetry,
    ],
  );

  const handlePlay = () => canvasRef.current?.play();
  const handlePause = () => canvasRef.current?.pause();
  const handleReset = () => canvasRef.current?.reset();
  const handleResetView = () => {
    setZoom(1);
    canvasRef.current?.resetView();
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.3, 100));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.3, 0.01));

  return (
    <div className="w-screen h-screen bg-base-200 flex flex-col items-center justify-center relative font-sans overflow-hidden">
      <div className="absolute top-0 w-screen px-4 flex items-center justify-center md:justify-between gap-3 z-20 flex-wrap bg-base-100 md:bg-transparent">
        <img
          src="/sprite.png"
          className="w-16 h-16 p-2 rounded-full bg-base-100/80 border border-base-300 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
        />
        {/* Header Bar */}
        <div className="border px-6 py-3 bg-base-100/80 backdrop-blur-md border-b border-base-300 rounded-b-2xl shadow-md text-center md:translate-x-27">
          <h1 className="text-3xl font-bold text-base-content">
            Code a Pookalam
          </h1>
          <p className="text-sm text-base-content/70">
            Happy Onam! Here's my AutoGraph.
          </p>
        </div>
        {/* Top Controls (GitHub + Settings) */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/alpha-og/autograph"
            target="_blank"
            rel="noreferrer"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-base-100/80 border border-base-300 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300">
              <img
                src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                alt="GitHub"
                className="w-5 h-5 rounded-full"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <span className="font-medium text-sm">Star on GitHub</span>
              <img
                src="https://img.shields.io/github/stars/alpha-og/autograph?style=social"
                alt="GitHub Repo stars"
                className="h-5"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          </a>

          <button
            onClick={() => setShowControls((prev) => !prev)}
            className="btn btn-secondary btn-circle shadow-md hover:shadow-lg transition-all duration-300"
            aria-label="Toggle Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
      <div className="w-full h-full flex flex-row bg-base-100 shadow-xl overflow-hidden relative">
        <DrawingCanvas
          ref={canvasRef}
          equation={equation}
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

        <div
          className={`
      absolute top-0 right-0 z-40 h-full w-80 bg-base-100/80 backdrop-blur-sm border-l border-base-300
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
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
      />
    </div>
  );
}
