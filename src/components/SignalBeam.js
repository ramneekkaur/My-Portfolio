"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";

const BEAM_MS = 1400;

// Ask the beam to fire from (x, y) — called by the contact form on submit.
export function transmitSignal(x, y) {
  window.dispatchEvent(new CustomEvent("signal:transmit", { detail: { x, y } }));
}

// The message arrived — a distant star blinks back.
export function acknowledgeSignal() {
  window.dispatchEvent(new Event("signal:ack"));
}

// "Send a Signal Across the Stars": a thin beam of light rises from the
// Transmit button into the sky, and when the message arrives a distant star
// high above blinks back twice with a fine expanding ring.
export default function SignalBeam() {
  const reduceMotion = usePrefersReducedMotion();
  const [beam, setBeam] = useState(null);
  const [reply, setReply] = useState(null);
  const lastBeamX = useRef(null);

  useEffect(() => {
    const onTransmit = (event) => {
      lastBeamX.current = event.detail.x;
      if (!reduceMotion) setBeam({ ...event.detail, key: performance.now() });
    };
    const onAck = () => {
      setReply({ x: lastBeamX.current ?? window.innerWidth * 0.7, key: performance.now() });
    };
    window.addEventListener("signal:transmit", onTransmit);
    window.addEventListener("signal:ack", onAck);
    return () => {
      window.removeEventListener("signal:transmit", onTransmit);
      window.removeEventListener("signal:ack", onAck);
    };
  }, [reduceMotion]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[93]">
      {beam && (
        <div
          key={beam.key}
          className="signal-beam"
          style={{ left: beam.x, height: beam.y, "--beam-ms": `${BEAM_MS}ms` }}
          onAnimationEnd={(event) => event.target === event.currentTarget && setBeam(null)}
        >
          <span className="signal-beam-pulse" />
        </div>
      )}
      {reply && (
        <div
          key={reply.key}
          className="signal-reply"
          style={{ left: reply.x, top: "9vh" }}
          onAnimationEnd={(event) => event.target === event.currentTarget && setReply(null)}
        >
          <span className="signal-reply-ring" />
        </div>
      )}
    </div>
  );
}
