import stations from "../data/stations.json";

const stationsConfig = stations as Array<{ id: string }>;

export type StationState = {
  id: string;
  level: number;
  hasManager: boolean;
  stored: number; // ready to collect
  isProducing: boolean;
  productionEndsAt: number | null;
  productionDurationSeconds: number | null;
  pendingCoins: number;
};

export type GameState = {
  coins: number;
  stations: StationState[];
};

export const initialState: GameState = {
  coins: 100,
  stations: stationsConfig.map((station, index) => ({
    id: station.id,
    level: index === 0 ? 1 : 0,
    hasManager: false,
    stored: 0,
    isProducing: false,
    productionEndsAt: null,
    productionDurationSeconds: null,
    pendingCoins: 0,
  })),
};
