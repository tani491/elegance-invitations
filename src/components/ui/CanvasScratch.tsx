"use client";

import { useEffect, useRef } from "react";

export function CanvasScratch({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const bounds = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(bounds.width * ratio);
    canvas.height = Math.floor(bounds.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const gradient = context.createLinearGradient(0, 0, bounds.width, bounds.height);
    gradient.addColorStop(0, "#fff1b8");
    gradient.addColorStop(0.45, "#c89731");
    gradient.addColorStop(1, "#7b5317");
    context.fillStyle = gradient;
    context.fillRect(0, 0, bounds.width, bounds.height);
    context.fillStyle = "rgba(255,255,255,.35)";
    context.font = "600 11px serif";
    context.textAlign = "center";
    context.fillText("GRATTEZ", bounds.width / 2, bounds.height / 2);
  }, []);

  function scratch(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !drawingRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    context.arc(x, y, 18, 0, Math.PI * 2);
    context.fill();
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <div className="grid size-full place-items-center">{children}</div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full touch-none cursor-grab"
        onPointerDown={(event) => {
          drawingRef.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          scratch(event);
        }}
        onPointerMove={scratch}
        onPointerUp={(event) => {
          drawingRef.current = false;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          drawingRef.current = false;
        }}
      />
    </div>
  );
}
