"use client";

import { useState, useEffect } from "react";
import { getStoredDensity, type JournalDensity } from "@/lib/journalDensity";

export function useJournalDensity(): JournalDensity {
  const [density, setDensity] = useState<JournalDensity>("default");

  useEffect(() => {
    setDensity(getStoredDensity());
    const handler = (e: Event) => setDensity((e as CustomEvent<JournalDensity>).detail);
    window.addEventListener("tj-density-change", handler);
    return () => window.removeEventListener("tj-density-change", handler);
  }, []);

  return density;
}
