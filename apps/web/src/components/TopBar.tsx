"use client";

type TopBarProps = {
  coinsLabel: string;
};

export function TopBar({ coinsLabel }: TopBarProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      <b>Coins:</b> {coinsLabel}
    </div>
  );
}
