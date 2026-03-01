"use client";

import Image from "next/image";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type TopBarProps = {
  coinsLabel: string;
};

export function TopBar({ coinsLabel }: TopBarProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      <b>Coins:</b>{" "}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <Image
          src={`${basePath}/ui/icons/coin.webp`}
          alt=""
          aria-hidden="true"
          width={16}
          height={16}
          style={{ display: "block", borderRadius: 999 }}
        />
        <span>{coinsLabel}</span>
      </span>
    </div>
  );
}
