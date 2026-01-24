"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

type OffloadData = {
  [containerId: string]: {
    receivedCounts: { [itemId: string]: number };
    items: any[];
  };
};

const OffloadContext = createContext<{
  offloadState: OffloadData;
  saveOffloadState: (containerId: string, data: OffloadData[string]) => void;
  clearOffloadState: (containerId: string) => void;
}>({
  offloadState: {},
  saveOffloadState: () => {},
  clearOffloadState: () => {},
});

const STORAGE_KEY = "offload_state";

export const OffloadProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [offloadState, setOffloadState] = useState<OffloadData>({});
  const [isHydrated, setIsHydrated] = useState(false);

  // Load state from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState && savedState !== "undefined" && savedState !== "null") {
        setOffloadState(JSON.parse(savedState));
      }
    } catch (error) {
      console.error("Failed to load offload state from localStorage:", error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(offloadState));
      } catch (error) {
        console.error("Failed to save offload state to localStorage:", error);
      }
    }
  }, [offloadState, isHydrated]);

  const saveOffloadState = useCallback((containerId: string, data: OffloadData[string]) => {
    setOffloadState((prev) => {
      // Check if data is the same to prevent unnecessary updates
      const existingData = prev[containerId];
      if (existingData && 
          JSON.stringify(existingData.receivedCounts) === JSON.stringify(data.receivedCounts) &&
          existingData.items.length === data.items.length) {
        return prev; // No change needed
      }
      return { ...prev, [containerId]: data };
    });
  }, []);

  const clearOffloadState = useCallback((containerId: string) => {
    setOffloadState((prev) => {
      const updated = { ...prev };
      delete updated[containerId];
      return updated;
    });
  }, []);

  return (
    <OffloadContext.Provider
      value={{ offloadState, saveOffloadState, clearOffloadState }}
    >
      {children}
    </OffloadContext.Provider>
  );
};

export const useOffloadContext = () => {
  const context = useContext(OffloadContext);
  if (!context) {
    throw new Error("useOffloadContext must be used within an OffloadProvider");
  }
  return context;
};