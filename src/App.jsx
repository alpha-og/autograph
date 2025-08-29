import DrawingCanvas from "./components/DrawingCanvas";

export default function App() {
  return (
    <div className="p-6 space-y-8">
      <DrawingCanvas
        spriteUrl="/sprite.png"
        width={700}
        height={500}
        scale={50}
      />
    </div>
  );
}
