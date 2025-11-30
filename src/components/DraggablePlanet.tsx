"use client";

import Image from "next/image";

interface DraggablePlanetProps {
  src: string;
  defaultX: number;
  defaultY: number;
  size: string;
  mdSize: string;
  rotation: number;
  blur: number;
}

export default function DraggablePlanet({
  src,
  defaultX,
  defaultY,
  size,
  mdSize,
  rotation,
  blur,
}: DraggablePlanetProps) {
  return (
    <div
      className={`hidden lg:block absolute ${size} ${mdSize} z-0 select-none pointer-events-none`}
      style={{
        left: defaultX,
        top: defaultY,
      }}
    >
      <div
        className="relative w-full h-full"
        style={{ transform: `rotate(${rotation}deg)`, filter: `blur(${blur}px)` }}
      >
        <Image
          alt=""
          className="object-cover pointer-events-none"
          src={src}
          fill
          unoptimized
          draggable={false}
        />
      </div>
    </div>
  );
}
