import { create } from "zustand";

type UiStore = {
  mobileSidebarOpen: boolean;
  selectedApplicationId: string | null;
  setMobileSidebarOpen: (next: boolean) => void;
  setSelectedApplicationId: (id: string | null) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  mobileSidebarOpen: false,
  selectedApplicationId: null,
  setMobileSidebarOpen: (next) => set({ mobileSidebarOpen: next }),
  setSelectedApplicationId: (id) => set({ selectedApplicationId: id }),
}));
