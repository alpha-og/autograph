import { mulberry32 } from "./rng";

// Golden ratio for natural proportions
const PHI = (1 + Math.sqrt(5)) / 2;
const PHI_INV = 1 / PHI;

// A collection of functions that generate different fractal patterns.
export const fractalPatterns = {
  // Classic spiral with fibonacci scaling
  fibonacci: (t, scale, freq, amplitude) => {
    const fibScale = 1 + Math.log(1 + t / (2 * Math.PI)) * PHI_INV;
    return scale * fibScale * (1 + amplitude * Math.sin(freq * t));
  },

  // Dragon curve inspired pattern
  dragon: (t, scale, freq, amplitude) => {
    const n = Math.floor((t * freq) / (2 * Math.PI));
    const dragonValue = ((n & -n) << 1) & n ? 1 : -1;
    return scale * (1 + amplitude * dragonValue * Math.cos(t * freq));
  },

  // Koch snowflake inspired
  koch: (t, scale, freq, amplitude) => {
    let sum = 0;
    for (let i = 0; i < 4; i++) {
      sum += Math.cos(freq * Math.pow(3, i) * t) / Math.pow(3, i);
    }
    return scale * (1 + amplitude * sum);
  },

  // Mandelbrot set inspired ripples
  mandelbrot: (t, scale, freq, amplitude) => {
    const z = { r: Math.cos(t), i: Math.sin(t) };
    let magnitude = 0;
    for (let i = 0; i < 8; i++) {
      const newR = z.r * z.r - z.i * z.i + 0.3;
      const newI = 2 * z.r * z.i + 0.1;
      z.r = newR;
      z.i = newI;
      magnitude = Math.sqrt(z.r * z.r + z.i * z.i);
      if (magnitude > 2) break;
    }
    return scale * (1 + amplitude * Math.sin(magnitude * freq * t));
  },

  // Fern leaf pattern
  fern: (t, scale, freq, amplitude) => {
    const leaf = Math.exp(-t * 0.5) * Math.cos(freq * t) * Math.sin(t * 2);
    return scale * (1 + amplitude * leaf);
  },
};

/**
 * Generates the Pookalam pattern function based on enhanced parameters.
 * @param {object} params - The parameters for generating the pookalam.
 * @param {number} params.size - Base radius of the pattern.
 * @param {number} params.density - Controls the number of layers (0.3-1.0).
 * @param {number} params.petals - Main petal count (4-16).
 * @param {number} params.style - Seed for pattern variation.
 * @param {number} params.complexity - Additional complexity factor (0.0-1.0).
 * @param {number} params.symmetry - Symmetry factor (0.5-1.0).
 * @returns {function(number): Array<object>} A function that takes time `t` and returns an array of points.
 */
export const finalPookalam = (params) => {
  return (t) => {
    const points = [];
    const baseRadius = params.size;
    const complexityFactor = params.complexity || 0.7;
    const symmetryFactor = params.symmetry || 1.0;
    const numLayers = Math.max(3, Math.floor(params.density * 10));
    const mainPetals = Math.max(4, Math.floor(params.petals));
    const goldenAngle = 2 * Math.PI * PHI_INV;

    const rand = mulberry32(params.style + 54321);

    const patternTypes = Object.keys(fractalPatterns);
    const primaryPattern =
      patternTypes[Math.floor(rand() * patternTypes.length)];
    const secondaryPattern =
      patternTypes[Math.floor(rand() * patternTypes.length)];

    const asymmetryOffset = (1 - symmetryFactor) * (rand() - 0.5) * 0.3;

    for (let layerIdx = 0; layerIdx < numLayers; layerIdx++) {
      const layerProgress = layerIdx / (numLayers - 1);
      const radiusScale = 1 - layerProgress * 0.9;
      const currentRadius = baseRadius * radiusScale;
      const patternBlend = Math.sin(layerProgress * Math.PI);
      const primaryWeight = patternBlend;
      const secondaryWeight = 1 - patternBlend;
      const amplitude =
        (0.05 + complexityFactor * 0.15) *
        (1 + Math.sin(layerProgress * Math.PI));

      // Main ring with blended fractal patterns
      const r1 = fractalPatterns[primaryPattern](
        t,
        currentRadius,
        mainPetals,
        amplitude,
      );
      const r2 = fractalPatterns[secondaryPattern](
        t + asymmetryOffset,
        currentRadius,
        mainPetals * 0.7,
        amplitude * 0.6,
      );

      // ✅ FIX: Clamp the main radius to stay within the current layer's bounds.
      const r_main = Math.min(
        r1 * primaryWeight + r2 * secondaryWeight,
        currentRadius,
      );

      points.push({
        x: r_main * Math.cos(t),
        y: r_main * Math.sin(t),
        depth: layerIdx * 50,
        layer: "main",
        color: Math.floor((layerIdx * 7) / numLayers),
        pattern: primaryPattern,
      });

      // Detailed petal structures
      if (complexityFactor > 0.4) {
        const petalRadius = currentRadius * (0.4 + complexityFactor * 0.3);
        const numDetailPetals = Math.floor(
          mainPetals * (0.5 + complexityFactor * 0.5),
        );

        for (let petalIdx = 0; petalIdx < numDetailPetals; petalIdx++) {
          const petalAngle =
            (petalIdx / numDetailPetals) * 2 * Math.PI + layerIdx * 0.1;
          const petalCenterRadius = currentRadius * 0.6;
          const petalCenterX = petalCenterRadius * Math.cos(petalAngle);
          const petalCenterY = petalCenterRadius * Math.sin(petalAngle);
          const localT = t * (1 + petalIdx * 0.1) + petalAngle;
          const r_petal = fractalPatterns[secondaryPattern](
            localT,
            petalRadius * 0.4,
            Math.floor(4 + complexityFactor * 4),
            amplitude * 1.5,
          );

          let finalX = petalCenterX + r_petal * Math.cos(localT);
          let finalY = petalCenterY + r_petal * Math.sin(localT);

          // ✅ FIX: Check distance from origin and scale down if it exceeds base radius.
          const distanceFromOrigin = Math.sqrt(
            finalX * finalX + finalY * finalY,
          );
          if (distanceFromOrigin > baseRadius) {
            const scaleDown = baseRadius / distanceFromOrigin;
            finalX *= scaleDown;
            finalY *= scaleDown;
          }

          points.push({
            x: finalX,
            y: finalY,
            depth: layerIdx * 50 + 500,
            layer: "petals",
            color: ((petalIdx + layerIdx) % 5) + 2,
            pattern: secondaryPattern,
          });
        }
      }

      // Central mandala core
      if (layerIdx >= numLayers * 0.6) {
        const coreRadius = currentRadius * 0.25;
        const coreComplexity = Math.floor(4 + complexityFactor * 8);
        const coreAmplitude = amplitude * (2 - layerProgress);

        let r_core_base = coreRadius;
        for (let harmonic = 1; harmonic <= 3; harmonic++) {
          r_core_base +=
            fractalPatterns[primaryPattern](
              t * harmonic,
              coreRadius / (harmonic * 2),
              coreComplexity * harmonic,
              coreAmplitude / harmonic,
            ) -
            coreRadius / (harmonic * 2);
        }

        // ✅ FIX: Clamp the core radius to its boundary.
        const r_core = Math.min(r_core_base, coreRadius);

        points.push({
          x: r_core * Math.cos(t + layerIdx * goldenAngle),
          y: r_core * Math.sin(t + layerIdx * goldenAngle),
          depth: layerIdx * 50 + 1000,
          layer: "core",
          color: 7 + (layerIdx % 2),
          pattern: primaryPattern,
        });
      }
    }

    return points;
  };
};

// Pattern presets for easy variety
export const pookalamPresets = {
  traditional: {
    size: 100,
    density: 0.6,
    petals: 8,
    complexity: 0.5,
    symmetry: 1.0,
    style: 1,
  },
  ornate: {
    size: 100,
    density: 0.9,
    petals: 12,
    complexity: 0.8,
    symmetry: 0.95,
    style: 2,
  },
  minimalist: {
    size: 100,
    density: 0.4,
    petals: 6,
    complexity: 0.3,
    symmetry: 1.0,
    style: 3,
  },
  organic: {
    size: 100,
    density: 0.7,
    petals: 10,
    complexity: 0.9,
    symmetry: 0.7,
    style: 4,
  },
  geometric: {
    size: 100,
    density: 0.8,
    petals: 16,
    complexity: 0.6,
    symmetry: 1.0,
    style: 5,
  },
};

/**
 * Creates a function that generates a pookalam pattern morphed between two sets of parameters.
 * @param {object} startParams - The starting parameters.
 * @param {object} endParams - The ending parameters.
 * @param {number} morphProgress - A value from 0 to 1 indicating the morphing progress.
 * @returns {function(number): Array<object>} A function that generates the morphed pattern.
 */
export const morphingPookalam = (startParams, endParams, morphProgress) => {
  const morphed = {};

  Object.keys(startParams).forEach((key) => {
    if (typeof startParams[key] === "number") {
      morphed[key] =
        startParams[key] + (endParams[key] - startParams[key]) * morphProgress;
    } else {
      morphed[key] = morphProgress < 0.5 ? startParams[key] : endParams[key];
    }
  });

  return finalPookalam(morphed);
};
