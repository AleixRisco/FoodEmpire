"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import stationsData from "../data/stations.json";
import { StationCard } from "../components/StationCard";
import { TopBar } from "../components/TopBar";
import { initialState, type GameState, type StationState } from "../mock/state";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const STORAGE_KEY = "food-empire-game-state";
const THEME_STORAGE_KEY = "food-empire-theme";
const COIN_FLIGHT_MS = 800;
const COIN_COUNTUP_MS = 420;

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

type StationLevelConfig = {
  level: number;
  cost: number;
  productionSeconds: number;
  coinsReward: number;
};

type StationConfig = {
  id: string;
  name: string;
  manager?: {
    unlockLevel: number;
  };
  levels: StationLevelConfig[];
};

const stationsConfig = stationsData as StationConfig[];
const stationsConfigById = new Map(stationsConfig.map((station) => [station.id, station]));

type CoinFlight = {
  id: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  delayMs: number;
};

function hasUnlockedManager(station: StationState, unlockLevel: number | undefined) {
  return unlockLevel !== undefined && station.level >= unlockLevel;
}

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

function formatDuration(totalSeconds: number) {
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function reconcileStationState(station: StationState, now: number) {
  const stationConfig = stationsConfigById.get(station.id);
  const currentLevel = stationConfig?.levels.find((level) => level.level === station.level);
  const managerUnlocked = hasUnlockedManager(station, stationConfig?.manager?.unlockLevel);

  if (!stationConfig || !currentLevel || station.level === 0) {
    return {
      station: {
        ...station,
        hasManager: managerUnlocked ? true : station.hasManager,
      },
      coinsGained: 0,
    };
  }

  let nextStation = station;
  let coinsGained = 0;

  if (station.isProducing && station.productionEndsAt !== null && now >= station.productionEndsAt) {
    if (station.hasManager) {
      coinsGained += station.pendingCoins;
      nextStation = {
        ...station,
        isProducing: false,
        productionEndsAt: null,
        productionDurationSeconds: null,
        stored: 0,
        pendingCoins: 0,
      };
    } else {
      nextStation = {
        ...station,
        isProducing: false,
        productionEndsAt: null,
        productionDurationSeconds: null,
        stored: +(station.stored + station.pendingCoins).toFixed(2),
        pendingCoins: 0,
      };
    }
  }

  if (managerUnlocked) {
    nextStation = {
      ...nextStation,
      hasManager: true,
    };
  }

  if (nextStation.hasManager && !nextStation.isProducing && nextStation.stored <= 0) {
    nextStation = {
      ...nextStation,
      isProducing: true,
      productionEndsAt: now + currentLevel.productionSeconds * 1000,
      productionDurationSeconds: currentLevel.productionSeconds,
      pendingCoins: currentLevel.coinsReward,
    };
  }

  return { station: nextStation, coinsGained };
}

function parseStoredState(now: number): GameState {
  if (typeof window === "undefined") {
    return initialState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return initialState;
    }

    const parsed = JSON.parse(raw) as Partial<GameState>;
    const parsedStations = Array.isArray(parsed.stations) ? parsed.stations : [];

    return {
      coins: isFiniteNumber(parsed.coins) ? parsed.coins : initialState.coins,
      stations: initialState.stations.map((station) => {
        const savedStation = parsedStations.find((item) => item?.id === station.id);

        if (!savedStation) {
          return station;
        }

        const mergedStation: StationState = {
          id: station.id,
          level: isFiniteNumber(savedStation.level) ? savedStation.level : station.level,
          hasManager: typeof savedStation.hasManager === "boolean" ? savedStation.hasManager : station.hasManager,
          stored: isFiniteNumber(savedStation.stored) ? savedStation.stored : station.stored,
          isProducing: typeof savedStation.isProducing === "boolean" ? savedStation.isProducing : station.isProducing,
          productionEndsAt:
            savedStation.productionEndsAt === null || isFiniteNumber(savedStation.productionEndsAt)
              ? savedStation.productionEndsAt
              : station.productionEndsAt,
          productionDurationSeconds:
            savedStation.productionDurationSeconds === null || isFiniteNumber(savedStation.productionDurationSeconds)
              ? savedStation.productionDurationSeconds
              : station.productionDurationSeconds,
          pendingCoins: isFiniteNumber(savedStation.pendingCoins) ? savedStation.pendingCoins : station.pendingCoins,
        };

        return reconcileStationState(mergedStation, now).station;
      }),
    };
  } catch {
    return initialState;
  }
}

export default function Home() {
  const [state, setState] = useState<GameState>(() => parseStoredState(Date.now()));
  const [displayedCoins, setDisplayedCoins] = useState(() => parseStoredState(Date.now()).coins);
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);
  const [now, setNow] = useState(() => Date.now());
  const [coinFlights, setCoinFlights] = useState<CoinFlight[]>([]);
  const [isTopBarAnimating, setIsTopBarAnimating] = useState(false);
  const coinsTargetRef = useRef<HTMLSpanElement | null>(null);
  const flightIdRef = useRef(0);
  const countupFrameRef = useRef<number | null>(null);
  const displayedCoinsRef = useRef(displayedCoins);

  const stationsById = useMemo(() => stationsConfigById, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    displayedCoinsRef.current = displayedCoins;
  }, [displayedCoins]);

  useEffect(() => {
    if (countupFrameRef.current !== null) {
      window.cancelAnimationFrame(countupFrameRef.current);
    }

    const from = displayedCoinsRef.current;
    const to = state.coins;

    if (Math.abs(to - from) < 0.01) {
      countupFrameRef.current = window.requestAnimationFrame(() => {
        setDisplayedCoins(to);
        countupFrameRef.current = null;
      });
      return;
    }

    const startedAt = performance.now();

    const tick = (timestamp: number) => {
      const elapsed = timestamp - startedAt;
      const progress = Math.min(1, elapsed / COIN_COUNTUP_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = from + (to - from) * eased;

      setDisplayedCoins(progress === 1 ? to : nextValue);

      if (progress < 1) {
        countupFrameRef.current = window.requestAnimationFrame(tick);
      } else {
        countupFrameRef.current = null;
      }
    };

    countupFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (countupFrameRef.current !== null) {
        window.cancelAnimationFrame(countupFrameRef.current);
        countupFrameRef.current = null;
      }
    };
  }, [state.coins]);

  useEffect(() => {
    const id = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      setState((prev) => {
        let coinsGained = 0;
        const stations = prev.stations.map((station) => {
          const result = reconcileStationState(station, currentTime);
          coinsGained += result.coinsGained;
          return result.station;
        });

        return {
          ...prev,
          coins: +(prev.coins + coinsGained).toFixed(2),
          stations,
        };
      });
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

      const managerUnlocked =
        stationConfig.manager?.unlockLevel !== undefined && nextLevel.level >= stationConfig.manager.unlockLevel;
      const shouldAutoStart = managerUnlocked && !station.isProducing;

      return {
        ...prev,
        coins: +(prev.coins - nextLevel.cost).toFixed(2),
        stations: prev.stations.map((item) =>
          item.id === stationId
            ? {
                ...item,
                level: nextLevel.level,
                hasManager: managerUnlocked ? true : item.hasManager,
                stored: shouldAutoStart ? 0 : item.stored,
                isProducing: shouldAutoStart ? true : item.isProducing,
                productionEndsAt: shouldAutoStart ? Date.now() + nextLevel.productionSeconds * 1000 : item.productionEndsAt,
                productionDurationSeconds: shouldAutoStart
                  ? nextLevel.productionSeconds
                  : item.productionDurationSeconds,
                pendingCoins: shouldAutoStart ? nextLevel.coinsReward : item.pendingCoins,
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
                productionDurationSeconds: currentLevel.productionSeconds,
                pendingCoins: currentLevel.coinsReward,
              }
            : item
        ),
      };
    });
  };

  const spawnCoinFlight = (sourceRect: DOMRect) => {
    const targetRect = coinsTargetRef.current?.getBoundingClientRect();

    if (!targetRect) {
      return;
    }

    const sourceX = sourceRect.left + sourceRect.width / 2;
    const sourceY = sourceRect.top + sourceRect.height / 2;
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    const nextFlights = Array.from({ length: 4 }, (_, index) => {
      flightIdRef.current += 1;

      return {
        id: flightIdRef.current,
        startX: sourceX + (index - 1.5) * 6,
        startY: sourceY - index * 3,
        deltaX: targetX - (sourceX + (index - 1.5) * 6),
        deltaY: targetY - (sourceY - index * 3),
        delayMs: index * 60,
      };
    });

    setCoinFlights((prev) => [...prev, ...nextFlights]);

    window.setTimeout(() => {
      setCoinFlights((prev) => prev.filter((flight) => !nextFlights.some((item) => item.id === flight.id)));
      setIsTopBarAnimating(true);
      window.setTimeout(() => {
        setIsTopBarAnimating(false);
      }, 180);
    }, COIN_FLIGHT_MS + nextFlights[nextFlights.length - 1].delayMs);
  };

  const onCollectStationAnimated = (stationId: string, sourceRect: DOMRect) => {
    spawnCoinFlight(sourceRect);

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
    <main
      style={{
        height: "100dvh",
        padding: 16,
        fontFamily: "system-ui",
        background: "var(--background)",
        color: "var(--foreground)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes coin-flight {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) scale(0.72);
          }
          15% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--coin-x), var(--coin-y), 0) scale(0.5);
          }
        }
      `}</style>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--background)",
          color: "inherit",
          paddingBottom: 8,
          flexShrink: 0,
          boxShadow: "0 1px 0 rgba(127, 127, 127, 0.16)",
        }}
      >
        <h1 style={{ marginBottom: 8 }}>Food Empire</h1>

        <TopBar
          coinsLabel={formatGameNumber(displayedCoins)}
          coinsTargetRef={coinsTargetRef}
          isAnimating={isTopBarAnimating}
          isDarkMode={theme === "dark"}
          onToggleDarkMode={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
        />

        <h2 style={{ marginTop: 8, marginBottom: 8 }}>Stations</h2>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          paddingBottom: 8,
        }}
      >
        <ul style={{ paddingLeft: 0, margin: 0 }}>
          {state.stations.map((station, index) => {
          const stationConfig = stationsById.get(station.id);
          const currentLevel = stationConfig?.levels.find((level) => level.level === station.level);
          const nextLevel = stationConfig?.levels.find((level) => level.level === station.level + 1);
          const managerConfig = stationConfig?.manager;
          const previousStation = index > 0 ? state.stations[index - 1] : null;
          const isBlockedByPrevious = station.level === 0 && previousStation !== null && previousStation.level === 0;
          const managerUnlocked = managerConfig !== undefined && station.level >= managerConfig.unlockLevel;
          const activeProductionSeconds = station.isProducing
            ? station.productionDurationSeconds ?? currentLevel?.productionSeconds ?? 0
            : currentLevel?.productionSeconds ?? 0;
          const activeProductionCoins = station.isProducing ? station.pendingCoins : currentLevel?.coinsReward ?? 0;
          const remainingSeconds =
            station.isProducing && station.productionEndsAt !== null
              ? Math.max(0, Math.ceil((station.productionEndsAt - now) / 1000))
              : 0;
          const progressPercent =
            station.isProducing &&
            station.productionEndsAt !== null &&
            activeProductionSeconds > 0
              ? Math.min(
                  1,
                  Math.max(
                    0,
                    1 - (station.productionEndsAt - now) / (activeProductionSeconds * 1000)
                  )
                )
              : 0;
          const progressTransitionEnabled = progressPercent > 0;

          if (!stationConfig) {
            return null;
          }

          return (
            <StationCard
              key={station.id}
              stationImageSrc={`${basePath}/ui/stations/station_${station.id}.webp`}
              managerImageSrc={`${basePath}/ui/managers/manager_${station.id}.webp`}
              stationName={stationConfig.name}
              level={station.level}
              maxLevel={stationConfig.levels.length}
              productionLabel={currentLevel ? formatGameNumber(activeProductionCoins) : "-"}
              timeLabel={currentLevel ? formatDuration(activeProductionSeconds) : "-"}
              collectAmountLabel={station.stored > 0 ? formatGameNumber(station.stored) : ""}
              isProducing={station.isProducing}
              remainingLabel={formatDuration(remainingSeconds)}
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
              showUpgradeCoinIcon={nextLevel !== undefined && !isBlockedByPrevious}
              canUpgrade={nextLevel !== undefined && !isBlockedByPrevious && state.coins >= nextLevel.cost}
              hasManager={station.hasManager || managerUnlocked}
              showManagerLockedOverlay={!(station.hasManager || managerUnlocked)}
              showLockedOverlay={station.level === 0}
              onUpgrade={() => onUpgrade(station.id)}
              onStart={() => onStartProduction(station.id)}
              onCollect={(sourceRect) => onCollectStationAnimated(station.id, sourceRect)}
              progressTransitionEnabled={progressTransitionEnabled}
            />
          );
          })}
        </ul>
      </div>

      <div style={{ pointerEvents: "none", position: "fixed", inset: 0, zIndex: 50 }}>
        {coinFlights.map((flight) => (
          <span
            key={flight.id}
            style={{
              position: "fixed",
              left: flight.startX,
              top: flight.startY,
              marginLeft: -11,
              marginTop: -11,
              width: 22,
              height: 22,
              display: "block",
              animationName: "coin-flight",
              animationDuration: `${COIN_FLIGHT_MS}ms`,
              animationDelay: `${flight.delayMs}ms`,
              animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              animationFillMode: "forwards",
              ["--coin-x" as string]: `${flight.deltaX}px`,
              ["--coin-y" as string]: `${flight.deltaY}px`,
            }}
          >
            <Image
              src={`${basePath}/ui/icons/coin.webp`}
              alt=""
              aria-hidden="true"
              width={22}
              height={22}
              style={{ display: "block", borderRadius: 999 }}
            />
          </span>
        ))}
      </div>
    </main>
  );
}
