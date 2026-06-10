import { create } from 'zustand';
import { Park } from '../types';

interface ParkStore {
  selectedParkId: string | null;
  parks: Park[];
  setSelectedParkId: (parkId: string) => void;
  setParks: (parks: Park[]) => void;
  getSelectedPark: () => Park | undefined;
}

export const useParkStore = create<ParkStore>((set, get) => ({
  selectedParkId: null,
  parks: [],
  setSelectedParkId: (parkId) => set({ selectedParkId: parkId }),
  setParks: (parks) => set({ parks }),
  getSelectedPark: () => {
    const { selectedParkId, parks } = get();
    return parks.find(p => p.id === selectedParkId);
  },
}));
