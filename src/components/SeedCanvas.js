"use client";

import { Canvas } from "@react-three/fiber";
import { memo } from "react";
import Seed from "./Seed";

function SeedCanvas() {
  return (
    <div className="w-64 h-64 md:w-80 md:h-80 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ alpha: true }}
        style={{ background: "transparent" }}
      >
        <Seed />
      </Canvas>
    </div>
  );
}

export default memo(SeedCanvas);