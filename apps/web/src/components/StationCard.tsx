"use client";

import Image from "next/image";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type StationCardProps = {
  stationImageSrc: string;
  stationName: string;
  level: number;
  maxLevel: number;
  productionLabel: string;
  timeLabel: string;
  collectAmountLabel: string;
  isProducing: boolean;
  remainingSeconds: number;
  progressPercent: number;
  upgradeTitle: string;
  upgradeCostLabel: string;
  showUpgradeCoinIcon: boolean;
  canUpgrade: boolean;
  showLockedOverlay: boolean;
  onUpgrade: () => void;
  onStart: () => void;
  onCollect: () => void;
};

export function StationCard({
  stationImageSrc,
  stationName,
  level,
  maxLevel,
  productionLabel,
  timeLabel,
  collectAmountLabel,
  isProducing,
  remainingSeconds,
  progressPercent,
  upgradeTitle,
  upgradeCostLabel,
  showUpgradeCoinIcon,
  canUpgrade,
  showLockedOverlay,
  onUpgrade,
  onStart,
  onCollect,
}: StationCardProps) {
  const isLocked = level === 0;
  const isReadyToCollect = collectAmountLabel !== "";
  const levelProgressPercent = maxLevel > 0 ? Math.min(100, (level / maxLevel) * 100) : 0;
  const isUnlockAction = upgradeTitle === "Unlock";

  return (
    <li style={{ listStyle: "none", marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: 6,
          border: "1px solid #ddd",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          <span style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>{stationName}</span>
          <span>|</span>
          <span>Lv {level}</span>
          <span>|</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, minWidth: 0 }}>
            {!isLocked && (
              <Image
                src={`${basePath}/ui/icons/coin.webp`}
                alt=""
                aria-hidden="true"
                width={12}
                height={12}
                style={{ display: "block", borderRadius: 999 }}
              />
            )}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{isLocked ? "Locked" : productionLabel}</span>
          </span>
          <span>|</span>
          <span>{isLocked ? "-" : timeLabel}</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              flexShrink: 0,
              overflow: "hidden",
              borderRadius: 10,
              background: "#f3f4f6",
              position: "relative",
            }}
          >
            <Image
              src={stationImageSrc}
              alt={stationName}
              width={56}
              height={56}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {showLockedOverlay && (
              <>
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0, 0, 0, 0.45)",
                  }}
                />
                <Image
                  src={`${basePath}/ui/stations/overlays/station_lock.webp`}
                  alt=""
                  aria-hidden="true"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </>
            )}
          </div>

          <div
            style={{
              width: 92,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <button
              onClick={onUpgrade}
              disabled={!canUpgrade}
              style={{
                width: "100%",
                height: 44,
                padding: 8,
                borderRadius: 12,
                border: canUpgrade ? (isUnlockAction ? "1px solid #16a34a" : "1px solid #cbd5e1") : "1px solid #ddd",
                background: canUpgrade ? (isUnlockAction ? "#22c55e" : "#ffffff") : "transparent",
                color: canUpgrade ? (isUnlockAction ? "#052e16" : "#0f172a") : "inherit",
                boxShadow: canUpgrade ? "0 1px 2px rgba(15, 23, 42, 0.08)" : "none",
                fontSize: 12,
                opacity: canUpgrade ? 1 : 0.6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                lineHeight: 1,
              }}
            >
              <span>{upgradeTitle}</span>
              <span style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}>
                {showUpgradeCoinIcon && (
                  <Image
                    src={`${basePath}/ui/icons/coin.webp`}
                    alt=""
                    aria-hidden="true"
                    width={12}
                    height={12}
                    style={{ display: "block", borderRadius: 999 }}
                  />
                )}
                <span>{upgradeCostLabel}</span>
              </span>
            </button>

            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: "#dbeafe",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${levelProgressPercent}%`,
                  height: "100%",
                  background: "#2563eb",
                }}
              />
            </div>

            <div style={{ fontSize: 11, color: "#1d4ed8", textAlign: "right" }}>
              {level}/{maxLevel}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "stretch" }}>
            <div style={{ width: "100%" }}>
              {!isLocked && !isProducing && !isReadyToCollect && (
                <button
                  onClick={onStart}
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: 56,
                    borderRadius: 10,
                    border: "1px solid #16a34a",
                    background: "#22c55e",
                    color: "#052e16",
                    fontSize: 12,
                  }}
                >
                  Start
                </button>
              )}

              {!isLocked && isProducing && (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    minHeight: 56,
                    height: "100%",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    overflow: "hidden",
                    background: "#fff7ed",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: `${progressPercent * 100}%`,
                      background: "#f59e0b",
                      transition: "width 1s linear",
                    }}
                  />
                  <div
                    style={{
                      position: "relative",
                      zIndex: 1,
                      height: "100%",
                      minHeight: 56,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      color: "#1f2937",
                    }}
                  >
                    {remainingSeconds}s
                  </div>
                </div>
              )}

              {!isLocked && isReadyToCollect && (
                <button
                  onClick={onCollect}
                  style={{
                    width: "100%",
                    minHeight: 56,
                    height: "100%",
                    borderRadius: 10,
                    border: "1px solid #d97706",
                    background: "#f59e0b",
                    color: "#111827",
                    fontSize: 12,
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span>Collect</span>
                    <Image
                      src={`${basePath}/ui/icons/coin.webp`}
                      alt=""
                      aria-hidden="true"
                      width={14}
                      height={14}
                      style={{ display: "block", borderRadius: 999 }}
                    />
                    <span>{collectAmountLabel}</span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
