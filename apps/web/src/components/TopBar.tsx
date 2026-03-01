"use client";

import type { RefObject } from "react";
import Image from "next/image";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type TopBarProps = {
  coinsLabel: string;
  coinsTargetRef: RefObject<HTMLSpanElement | null>;
  isAnimating: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
};

export function TopBar({ coinsLabel, coinsTargetRef, isAnimating, isDarkMode, onToggleDarkMode }: TopBarProps) {
  return (
    <div
      style={{
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div>
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

      <button
        onClick={onToggleDarkMode}
        type="button"
        style={{
          height: 32,
          padding: "0 10px",
          borderRadius: 999,
          border: "1px solid #94a3b8",
          background: isDarkMode ? "#0f172a" : "#ffffff",
          color: isDarkMode ? "#e2e8f0" : "#0f172a",
          fontSize: 12,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {isDarkMode ? "Dark" : "Light"}
      </button>
    </div>
  );
}
