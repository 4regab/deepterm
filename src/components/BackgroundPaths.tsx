"use client";

import { motion } from "framer-motion";
import { useState, useCallback } from "react";

function FloatingPaths({
  position,
  mouseX,
  mouseY,
}: {
  position: number;
  mouseX: number;
  mouseY: number;
}) {
  const paths = Array.from({ length: 36 }, (_, i) => {
    const offsetX = (mouseX - 0.5) * 50 * (i * 0.1);
    const offsetY = (mouseY - 0.5) * 30 * (i * 0.1);

    return {
      id: i,
      d: `M-${380 - i * 5 * position + offsetX} -${189 + i * 6 + offsetY}C-${
        380 - i * 5 * position + offsetX
      } -${189 + i * 6 + offsetY} -${312 - i * 5 * position + offsetX} ${
        400 - i * 6 + offsetY
      } ${152 - i * 5 * position + offsetX} ${800 - i * 6 + offsetY}C${
        616 - i * 5 * position + offsetX
      } ${1200 - i * 6 + offsetY} ${684 - i * 5 * position + offsetX} ${
        2400 - i * 6 + offsetY
      } ${684 - i * 5 * position + offsetX} ${2400 - i * 6 + offsetY}`,
      width: 0.5 + i * 0.03,
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ minHeight: "100%" }}>
      <svg
        className="w-full text-[#171d2b]"
        viewBox="0 0 696 2400"
        fill="none"
        preserveAspectRatio="xMidYMin slice"
        style={{ height: "100%", minHeight: "2400px" }}
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.08 + path.id * 0.02}
            initial={{ pathLength: 0.3, opacity: 0.4 }}
            animate={{
              pathLength: 1,
              opacity: [0.2, 0.5, 0.2],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + path.id * 0.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export default function BackgroundPaths() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    },
    []
  );

  return (
    <div
      className="absolute top-0 left-0 right-0 bottom-0 overflow-visible pointer-events-none z-0"
      style={{ height: "100%" }}
      onMouseMove={handleMouseMove}
    >
      <FloatingPaths position={1} mouseX={mousePos.x} mouseY={mousePos.y} />
      <FloatingPaths position={-1} mouseX={mousePos.x} mouseY={mousePos.y} />
    </div>
  );
}
