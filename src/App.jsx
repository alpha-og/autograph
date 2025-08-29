import React, { useState, useCallback } from "react";
import DrawingCanvas from "./components/DrawingCanvas"; // Make sure the path is correct

/**
 * A component for rendering sliders to control the Pookalam parameters.
 */
function PookalamControls({ params, setParams }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setParams((prevParams) => ({
      ...prevParams,
      [name]: Number(value),
    }));
  };

  const controlData = [
    { name: "speed", min: 1, max: 20, step: 0.5, label: "Speed" },
    { name: "resolution", min: 5, max: 30, step: 1, label: "Resolution" },
    { name: "density", min: 10, max: 80, step: 1, label: "Density" },
    { name: "petals", min: 3, max: 12, step: 1, label: "Petals" },
    { name: "size", min: 4, max: 8, step: 0.1, label: "Size" },
  ];

  return (
    <div className="card bg-base-100 shadow-xl p-6 w-full max-w-3xl mx-auto space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {controlData.map(({ name, min, max, step, label }) => (
          <div className="form-control" key={name}>
            <label className="label text-sm font-medium">
              <span>
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
  });

  /**
   * This function is now wrapped in `useCallback`. This is a performance optimization
   * that ensures the function is only recreated when its dependencies (the user-
   * controllable parameters) change.
   */
  const finalPookalam = useCallback(
    (t) => {
      const points = [];
      // Parameters are now sourced from the state object
      const baseRadius = params.size;
      const numFillLayers = Math.floor(params.density);
      const mainPetals = Math.floor(params.petals);

      for (let i = 0; i < numFillLayers; i++) {
        const rScale = numFillLayers > 1 ? i / (numFillLayers - 1) : 1;
        const ringDepth = numFillLayers - i;

        // --- PHASE 3: The Outer Layer ---
        const outerMaxRadius = baseRadius;
        const outerRippleFreq = mainPetals * 3;
        const r_outer_outline =
          outerMaxRadius *
          (1 +
            0.15 * Math.sin(mainPetals * t) +
            0.04 * Math.cos(outerRippleFreq * t));
        const r_outer_scaled = r_outer_outline * rScale;
        points.push({
          x: r_outer_scaled * Math.cos(t),
          y: r_outer_scaled * Math.sin(t),
          depth: ringDepth,
        });

        // --- PHASE 2: The Middle Ring ---
        const midRingPositionRadius = baseRadius * 0.6;
        const midPetalMaxRadius = baseRadius * 0.28;
        const midPetalShape = 5;

        for (let j = 0; j < mainPetals; j++) {
          const petalAngle = (j / mainPetals) * Math.PI * 2;
          const petalCenterX = midRingPositionRadius * Math.cos(petalAngle);
          const petalCenterY = midRingPositionRadius * Math.sin(petalAngle);
          const r_mid_outline =
            midPetalMaxRadius * (1 + 0.3 * Math.cos(midPetalShape * t));
          const r_mid_scaled = r_mid_outline * rScale;
          const rotationAngle = Math.PI / 4;
          const x_mid_local = r_mid_scaled * Math.cos(t + rotationAngle);
          const y_mid_local = r_mid_scaled * Math.sin(t + rotationAngle);
          points.push({
            x: petalCenterX + x_mid_local,
            y: petalCenterY + y_mid_local,
            depth: ringDepth + 1000,
          });
        }

        // --- PHASE 1: The Core ---
        const coreMaxRadius = baseRadius * 0.35;
        const r_core_outline =
          coreMaxRadius * (1 - 0.3 * Math.sin(mainPetals * t + Math.PI / 2));
        const r_core_scaled = r_core_outline * rScale;
        points.push({
          x: r_core_scaled * Math.cos(t),
          y: r_core_scaled * Math.sin(t),
          depth: ringDepth + 2000,
        });
      }
      return points;
    },
    [params],
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 gap-8">
      <h1 className="text-3xl font-bold text-gray-800">Pookalam Autograph</h1>
      <div className="rounded-lg overflow-hidden shadow-2xl">
        <DrawingCanvas
          // Pass the controllable parameters as props to the canvas
          equation={finalPookalam}
          mode="fractal"
          spriteUrl="https://creazilla-store.fra1.digitaloceanspaces.com/emojis/56533/blossom-emoji.png"
          width={800}
          height={600}
          scale={45}
          resolution={params.resolution}
          speed={params.speed}
        />
      </div>
      <PookalamControls params={params} setParams={setParams} />
    </div>
  );
}
