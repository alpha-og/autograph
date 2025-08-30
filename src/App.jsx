import React, { useState, useRef, useMemo } from "react";
import { DrawingCanvas } from "./components/DrawingCanvas";
import { Play, Pause, RefreshCw, Minimize, Settings } from "lucide-react";
import { X } from "lucide-react";
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
  const handleChange = (e) => {
    const { name, value } = e.target;
    setParams((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

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
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() =>
            setParams((prev) => ({
              ...prev,
              ...pookalamPresets.traditional,
              style: Math.floor(Math.random() * 100),
            }))
          }
          className="btn btn-primary btn-sm"
        >
          Traditional
        </button>
        <button
          onClick={() =>
            setParams((prev) => ({
              ...prev,
              ...pookalamPresets.ornate,
              style: Math.floor(Math.random() * 100),
            }))
          }
          className="btn btn-primary btn-sm"
        >
          Ornate
        </button>
        <button
          onClick={() =>
            setParams((prev) => ({
              ...prev,
              ...pookalamPresets.minimalist,
              style: Math.floor(Math.random() * 100),
            }))
          }
          className="btn btn-primary btn-sm"
        >
          Minimalist
        </button>
        <button
          onClick={() =>
            setParams((prev) => ({
              ...prev,
              ...pookalamPresets.organic,
              style: Math.floor(Math.random() * 100),
            }))
          }
          className="btn btn-primary btn-sm"
        >
          Organic
        </button>
      </div>
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

export default function App() {
  const [params, setParams] = useState({
    speed: 10,
    resolution: 15,
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

  return (
    <div className="w-screen h-screen bg-base-200 flex flex-col items-center justify-center relative font-sans overflow-hidden">
      <div className="absolute top-5 right-5 flex justify-center items-center gap-2 z-10 w-max text-center ">
        <a
          href="https://github.com/alpha-og/autograph"
          target="_blank"
          rel="noreferrer"
        >
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-base-100 border-2 border-primary shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <img
              src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
              alt="GitHub"
              className="w-6 h-6 rounded-full"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <span className="font-semibold text-base text-primary">
              Star on GitHub
            </span>
            <img
              src="https://img.shields.io/github/stars/alpha-og/autograph?style=social"
              alt="GitHub Repo stars"
              className="h-6"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        </a>
        <button
          onClick={() => setShowControls((prev) => !prev)}
          className="btn btn-secondary btn-circle shadow-lg "
          aria-label="Toggle Settings"
        >
          <Settings />
        </button>
      </div>
      <div className="absolute top-0 z-10 w-max text-center bg-base-100/80 backdrop-blur-sm border-l border-base-300 p-4 rounded-br-2xl rounded-bl-2xl">
        <h1 className="text-4xl font-bold">Pookalam AutoGraph</h1>
        <p className="text-base-content/70">
          Happy Onam! Create a beautiful Pookalam with code.
        </p>
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
    </div>
  );
}
