import { useMemo } from "react";
import { MasterGameEntry } from "./types";

export function useGameIdentifier(masterGames: MasterGameEntry[]) {
  // 1. Create a Fast Lookup Map
  const masterLookup = useMemo(() => {
    const map = new Map<string, MasterGameEntry>();
    if (!masterGames) return map;

    masterGames.forEach((game) => {
      // Map Canonical ID
      if (game.canonicalId) map.set(game.canonicalId, game);

      // Map Linked Versions (PSN IDs, Xbox IDs)
      game.linkedVersions?.forEach((v) => {
        if (v.npCommunicationId) map.set(v.npCommunicationId, game);
        if (v.titleId) map.set(v.titleId, game);
      });
    });
    return map;
  }, [masterGames]);

  // 2. Helper to find a game
  const identifyGame = (id: string, name: string) => {
    // A. Try ID Match
    if (masterLookup.has(id)) return masterLookup.get(id);

    // B. Try Name Match (Fallback for Xbox)
    // In production, this should be stricter
    return masterGames.find((m) => m.displayName === name);
  };

  return { identifyGame };
}
