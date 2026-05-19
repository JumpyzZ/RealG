import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlayerLevel } from "../domain/types";

// Phase 1 keeps assignments as a flat (playerId, roundIndex) -> courtLabel map.
// Rounds/Matches as first-class entities arrive in Phase 3 with the algorithm.

export interface RosterPlayer {
  id: string;
  name: string;
  level: PlayerLevel;
}

interface SessionState {
  date: string;
  players: RosterPlayer[];
  // Court labels available tonight, e.g. ["13", "14", "19", "20"].
  courts: string[];
  roundCount: number;
  // Key: `${playerId}::${roundIndex}` (1-based round). Value: court label, or "" for rest.
  assignments: Record<string, string>;

  setDate: (date: string) => void;
  setPlayersFromNames: (names: string[]) => void;
  togglePlayerLevel: (playerId: string) => void;
  removePlayer: (playerId: string) => void;
  setCourts: (labels: string[]) => void;
  setRoundCount: (n: number) => void;
  setAssignment: (playerId: string, roundIndex: number, court: string) => void;
  resetAll: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

const makeId = () =>
  `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const initialState: Pick<
  SessionState,
  "date" | "players" | "courts" | "roundCount" | "assignments"
> = {
  date: today(),
  players: [],
  courts: [],
  roundCount: 8,
  assignments: {},
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      ...initialState,

      setDate: (date) => set({ date }),

      setPlayersFromNames: (names) =>
        set((state) => {
          const existingByName = new Map(
            state.players.map((p) => [p.name.toLowerCase(), p]),
          );
          const players: RosterPlayer[] = names.map((name) => {
            const prev = existingByName.get(name.toLowerCase());
            return prev ?? { id: makeId(), name, level: "B" };
          });
          // Drop assignments for removed players.
          const validIds = new Set(players.map((p) => p.id));
          const assignments = Object.fromEntries(
            Object.entries(state.assignments).filter(([key]) =>
              validIds.has(key.split("::")[0]),
            ),
          );
          return { players, assignments };
        }),

      togglePlayerLevel: (playerId) =>
        set((state) => ({
          players: state.players.map((p) =>
            p.id === playerId
              ? { ...p, level: p.level === "A" ? "B" : "A" }
              : p,
          ),
        })),

      removePlayer: (playerId) =>
        set((state) => {
          const assignments = { ...state.assignments };
          for (const key of Object.keys(assignments)) {
            if (key.startsWith(`${playerId}::`)) delete assignments[key];
          }
          return {
            players: state.players.filter((p) => p.id !== playerId),
            assignments,
          };
        }),

      setCourts: (labels) => set({ courts: labels }),

      setRoundCount: (n) => set({ roundCount: Math.max(1, Math.min(16, n)) }),

      setAssignment: (playerId, roundIndex, court) =>
        set((state) => {
          const key = `${playerId}::${roundIndex}`;
          const assignments = { ...state.assignments };
          if (!court) {
            delete assignments[key];
          } else {
            assignments[key] = court;
          }
          return { assignments };
        }),

      resetAll: () => set({ ...initialState, date: today() }),
    }),
    {
      name: "realg-session-v1",
      version: 1,
    },
  ),
);

export const cellKey = (playerId: string, roundIndex: number) =>
  `${playerId}::${roundIndex}`;
