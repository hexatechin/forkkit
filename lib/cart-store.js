"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCart = create(
  persist(
    (set, get) => ({
      tenantSlug: null,
      items: [],
      setTenant: (slug) => {
        if (get().tenantSlug && get().tenantSlug !== slug)
          set({ items: [], tenantSlug: slug });
        else set({ tenantSlug: slug });
      },
      addItem: (item) =>
        set({
          items: [...get().items, { ...item, lineId: crypto.randomUUID() }],
        }),
      updateQty: (lineId, qty) =>
        set({
          items: get().items.map((i) =>
            i.lineId === lineId ? { ...i, qty: Math.max(1, qty) } : i,
          ),
        }),
      removeItem: (lineId) =>
        set({ items: get().items.filter((i) => i.lineId !== lineId) }),
      clear: () => set({ items: [] }),
    }),
    { name: "indocia-cart" },
  ),
);
