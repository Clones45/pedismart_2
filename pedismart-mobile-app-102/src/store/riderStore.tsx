import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./storage";

type CustomLocation = {
  latitude: number;
  longitude: number;
  address: string;
  heading: number;
  speed?: number;
  timestamp?: number;
} | null;

interface RiderStoreProps {
  user: any;
  location: CustomLocation;
  onDuty: boolean;
  distanceTraveled: number;
  setUser: (data: any) => void;
  setOnDuty: (data: boolean) => void;
  setLocation: (data: CustomLocation) => void;
  addDistance: (meters: number) => void;
  resetDistance: () => void;
  clearRiderData: () => void;
}

export const useRiderStore = create<RiderStoreProps>()(
  persist(
    (set) => ({
      user: null,
      location: null,
      onDuty: false,
      distanceTraveled: 0,
      setUser: (data) => set({ user: data }),
      setLocation: (data) => set({ location: data }),
      setOnDuty: (data) => set({ onDuty: data }),
      addDistance: (meters) => set((state) => ({ distanceTraveled: (state.distanceTraveled || 0) + meters })),
      resetDistance: () => set({ distanceTraveled: 0 }),
      clearRiderData: () => set({ user: null, location: null, onDuty: false, distanceTraveled: 0 }),
    }),
    {
      name: "rider-store",
      partialize: (state) => ({
        user: state.user,
      }),
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
