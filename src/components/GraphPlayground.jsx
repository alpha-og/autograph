import React, { useState, useMemo } from "react";
import DrawingCanvas from "./erawingCanvas";
import { create, all } from "mathjs";

const math = create(all, {});

export default function GraphPlayground() {
  const [mode, setMode] = useState("equation");
  const [equationStr, setEquationStr] = useState("sin(a * x)");
  const [paramXStr, setParamXStr] = useState("cos(b * t)");
  const [paramYStr, setParamYStr] = useState("sin(b * t)");

  // Store dynamic parameters in an object
  const [params, setParams] = useState({ a: 1, b: 1 });

  // Extract symbols except "x" or "t"
  function getFreeSymbols(expr, exclude = []) {
    return expr
      .filter((node) => node.isSymbolNode)
      .map((n) => n.name)
      .filter((name) => !exclude.includes(name));
  }

  // Equation function
  const equationFn = useMemo(() => {
    if (mode !== "equation") return null;
    try {
      const expr = math.parse(equationStr).compile();
      return (x) => expr.evaluate({ ...params, x });
    } catch (err) {
      console.warn("Equation error:", err.message);
      return () => NaN;
    }
  }, [equationStr, params, mode]);

  // Parametric function
  const parametricFn = useMemo(() => {
    if (mode !== "parametric") return null;
    try {
      const exprX = math.parse(paramXStr).compile();
      const exprY = math.parse(paramYStr).compile();
      return (t) => ({
        x: exprX.evaluate({ ...params, t }),
        y: exprY.evaluate({ ...params, t }),
      });
    } catch (err) {
      console.warn("Parametric error:", err.message);
      return () => ({ x: NaN, y: NaN });
    }
  }, [paramXStr, paramYStr, params, mode]);

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <h1 className="text-2xl font-bold">Graph Drawer</h1>

      {/* Mode Switch */}
      <div className="flex gap-4 items-center">
        <label className="font-medium">Mode:</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="equation">Equation (y = f(x,...))</option>
          <option value="parametric">Parametric (x(t,...), y(t,...))</option>
        </select>
      </div>

      {/* Input field */}
      {mode === "equation" && (
        <div className="flex flex-col gap-2 w-96">
          <label>
            y ={" "}
            <input
              type="text"
              value={equationStr}
              onChange={(e) => setEquationStr(e.target.value)}
              className="w-full border px-2 py-1 rounded"
            />
          </label>
        </div>
      )}

      {mode === "parametric" && (
        <div className="flex flex-col gap-2 w-96">
          <label>
            x(t) ={" "}
            <input
              type="text"
              value={paramXStr}
              onChange={(e) => setParamXStr(e.target.value)}
              className="w-full border px-2 py-1 rounded"
            />
          </label>
          <label>
            y(t) ={" "}
            <input
              type="text"
              value={paramYStr}
              onChange={(e) => setParamYStr(e.target.value)}
              className="w-full border px-2 py-1 rounded"
            />
          </label>
        </div>
      )}

      {/* Dynamic parameter controls */}
      <div className="flex gap-4">
        {Object.keys(params).map((p) => (
          <div key={p} className="flex flex-col items-center">
            <label>{p}</label>
            <input
              type="number"
              value={params[p]}
              step="0.1"
              onChange={(e) =>
                setParams({ ...params, [p]: parseFloat(e.target.value) })
              }
              className="border px-2 py-1 rounded w-20"
            />
          </div>
        ))}
      </div>

      {/* Canvas */}
      <DrawingCanvas
        equation={mode === "equation" ? equationFn : null}
        parametric={mode === "parametric" ? parametricFn : null}
        spriteUrl="/sprite.png"
        width={700}
        height={500}
        scale={50}
      />
    </div>
  );
}
