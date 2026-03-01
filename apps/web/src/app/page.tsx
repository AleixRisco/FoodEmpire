"use client";

import { useEffect, useMemo, useState } from "react";
import stationsData from "../data/stations.json";
import { StationCard } from "../components/StationCard";
import { TopBar } from "../components/TopBar";
import { initialState } from "../mock/state";

function formatGameNumber(value: number) {
  const rounded = Math.max(0, Math.floor(value));

  if (rounded < 1000) {
    return `${rounded}`;
  }

  if (rounded < 1_000_000) {
    const thousands = Math.floor(rounded / 1000);
    const remainder = rounded % 1000;
    return remainder === 0 ? `${thousands}k` : `${thousands}k ${remainder}`;
  }

  if (rounded < 1_000_000_000) {
    const millions = Math.floor(rounded / 1_000_000);
    const remainderThousands = Math.floor((rounded % 1_000_000) / 1000);
    return remainderThousands === 0 ? `${millions}m` : `${millions}m ${remainderThousands}k`;
  }

  const billions = Math.floor(rounded / 1_000_000_000);
  const remainderMillions = Math.floor((rounded % 1_000_000_000) / 1_000_000);
  return remainderMillions === 0 ? `${billions}b` : `${billions}b ${remainderMillions}m`;
}

export default function Home() {
  const [state, setState] = useState(initialState);
  const [now, setNow] = useState(() => Date.now());

  const stationsById = useMemo(() => {
    return new Map(stationsData.map((station) => [station.id, station]));
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      setState((prev) => ({
        ...prev,
        stations: prev.stations.map((station) => {
          if (
            !station.isProducing ||
            station.productionEndsAt === null ||
            currentTime < station.productionEndsAt
          ) {
            return station;
          }

          return {
            ...station,
            isProducing: false,
            productionEndsAt: null,
            stored: +(station.stored + station.pendingCoins).toFixed(2),
            pendingCoins: 0,
          };
        }),
      }));
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const onUpgrade = (stationId: string) => {
    setState((prev) => {
      const station = prev.stations.find((item) => item.id === stationId);
      const stationConfig = stationsById.get(stationId);

      if (!station || !stationConfig) {
        return prev;
      }

      const nextLevel = stationConfig.levels.find((level) => level.level === station.level + 1);

      if (!nextLevel || prev.coins < nextLevel.cost) {
        return prev;
      }

      return {
        ...prev,
        coins: +(prev.coins - nextLevel.cost).toFixed(2),
        stations: prev.stations.map((item) =>
          item.id === stationId
            ? {
                ...item,
                level: nextLevel.level,
              }
            : item
        ),
      };
    });
  };

  const onStartProduction = (stationId: string) => {
    setState((prev) => {
      const station = prev.stations.find((item) => item.id === stationId);
      const stationConfig = stationsById.get(stationId);

      if (!station || !stationConfig || station.level === 0 || station.isProducing || station.stored > 0) {
        return prev;
      }

      const currentLevel = stationConfig.levels.find((level) => level.level === station.level);

      if (!currentLevel) {
        return prev;
      }

      return {
        ...prev,
        stations: prev.stations.map((item) =>
          item.id === stationId
            ? {
                ...item,
                isProducing: true,
                productionEndsAt: Date.now() + currentLevel.productionSeconds * 1000,
                pendingCoins: currentLevel.coinsReward,
              }
            : item
        ),
      };
    });
  };

  const onCollectStation = (stationId: string) => {
    setState((prev) => {
      const station = prev.stations.find((item) => item.id === stationId);

      if (!station || station.stored <= 0) {
        return prev;
      }

      return {
        ...prev,
        coins: +(prev.coins + station.stored).toFixed(2),
        stations: prev.stations.map((item) =>
          item.id === stationId
            ? {
                ...item,
                stored: 0,
              }
            : item
        ),
      };
    });
  };

  return (
    <main style={{ padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 8 }}>Food Empire</h1>

      <TopBar coinsLabel={formatGameNumber(state.coins)} />

      <h2 style={{ marginTop: 8, marginBottom: 8 }}>Stations</h2>

      <ul style={{ paddingLeft: 0, margin: 0 }}>
        {state.stations.map((station, index) => {
          const stationConfig = stationsById.get(station.id);
          const currentLevel = stationConfig?.levels.find((level) => level.level === station.level);
          const nextLevel = stationConfig?.levels.find((level) => level.level === station.level + 1);
          const previousStation = index > 0 ? state.stations[index - 1] : null;
          const isBlockedByPrevious = station.level === 0 && previousStation !== null && previousStation.level === 0;
          const remainingSeconds =
            station.isProducing && station.productionEndsAt !== null
              ? Math.max(0, Math.ceil((station.productionEndsAt - now) / 1000))
              : 0;
          const progressPercent =
            station.isProducing &&
            station.productionEndsAt !== null &&
            currentLevel !== undefined &&
            currentLevel.productionSeconds > 0
              ? Math.min(
                  1,
                  Math.max(
                    0,
                    1 - (station.productionEndsAt - now) / (currentLevel.productionSeconds * 1000)
                  )
                )
              : 0;

          if (!stationConfig) {
            return null;
          }

          return (
            <StationCard
              key={station.id}
              stationImageSrc={`/ui/stations/station_${station.id}.png`}
              stationName={stationConfig.name}
              level={station.level}
              maxLevel={stationConfig.levels.length}
              productionLabel={currentLevel ? formatGameNumber(currentLevel.coinsReward) : "-"}
              timeLabel={currentLevel ? `${currentLevel.productionSeconds}s` : "-"}
              collectLabel={station.stored > 0 ? `Collect ${formatGameNumber(station.stored)}` : ""}
              isProducing={station.isProducing}
              remainingSeconds={remainingSeconds}
              progressPercent={progressPercent}
              upgradeTitle={
                nextLevel
                  ? isBlockedByPrevious
                    ? "Wait"
                    : station.level === 0
                      ? "Unlock"
                      : "Upgrade"
                  : "Max"
              }
              upgradeCostLabel={
                nextLevel
                  ? isBlockedByPrevious
                    ? "Prev station"
                    : formatGameNumber(nextLevel.cost)
                  : "level"
              }
              canUpgrade={nextLevel !== undefined && !isBlockedByPrevious && state.coins >= nextLevel.cost}
              showLockedOverlay={station.level === 0}
              onUpgrade={() => onUpgrade(station.id)}
              onStart={() => onStartProduction(station.id)}
              onCollect={() => onCollectStation(station.id)}
            />
          );
        })}
      </ul>
    </main>
  );
}
