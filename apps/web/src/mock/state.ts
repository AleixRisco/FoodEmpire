import stations from "../data/stations.json";

export type StationState = {
  id: string;
  level: number;
  stored: number; // ready to collect
  isProducing: boolean;
  productionEndsAt: number | null;
  pendingCoins: number;
};

export type GameState = {
  coins: number;
  stations: StationState[];
};

export const initialState: GameState = {
  coins: 100,
  stations: stations.map((station, index) => ({
    id: station.id,
    level: index === 0 ? 1 : 0,
    stored: 0,
    isProducing: false,
    productionEndsAt: null,
    pendingCoins: 0,
  })),
};
