import { useState } from "react";
import DrawingCanvas from "./DrawingCanvas";
import { create, all } from "mathjs";

const math = create(all);

export default function EquationGrapher() {
  const [expr, setExpr] = useState("sin(x)");

  // Compile user input into function
  const equation = (x) => {
    try {
      const scope = { x };
      return math.evaluate(expr, scope);
    } catch {
      return NaN;
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-xl font-bold">Equation Grapher</h1>

      <input
        type="text"
        value={expr}
        onChange={(e) => setExpr(e.target.value)}
        className="border rounded p-2 shadow"
        placeholder="Enter equation, e.g. sin(x) or x^2"
      />

      <DrawingCanvas equation={equation} />
    </div>
  );
}
