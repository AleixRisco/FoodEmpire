"use client";

import type { RefObject } from "react";
import Image from "next/image";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type TopBarProps = {
  coinsLabel: string;
  coinsTargetRef: RefObject<HTMLSpanElement | null>;
  isAnimating: boolean;
};

export function TopBar({ coinsLabel, coinsTargetRef, isAnimating }: TopBarProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      <b>Coins:</b>{" "}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span
          ref={coinsTargetRef}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            transform: isAnimating ? "scale(1.16)" : "scale(1)",
            transition: "transform 180ms ease",
            transformOrigin: "center",
          }}
        >
          <Image
            src={`${basePath}/ui/icons/coin.webp`}
            alt=""
            aria-hidden="true"
            width={18}
            height={18}
            style={{ display: "block", borderRadius: 999 }}
          />
        </span>
        <span>{coinsLabel}</span>
      </span>
    </div>
  );
}
