"use client";

type CollectBarProps = {
  totalStored: number;
  onCollect: () => void;
};

export function CollectBar({ totalStored, onCollect }: CollectBarProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={onCollect}
        style={{
          padding: 12,
          borderRadius: 10,
          border: "1px solid #ddd",
          width: "100%",
          fontSize: 16,
        }}
      >
        Collect (+{totalStored.toFixed(2)})
      </button>
    </div>
  );
}
