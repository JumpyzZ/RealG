import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlayerLevel } from "../domain/types";

// Phase 2: assignments stay as a flat (playerId, roundIndex) -> courtLabel map.
// We add an activeRound pointer so the RoundBuilder always knows which round
// the organizer is editing. First-class Round/Match entities arrive with the
// algorithm in Phase 3.

export interface RosterPlayer {
  id: string;
  name: string;
  level: PlayerLevel;
}

export const COURT_CAPACITY = 4;

interface SessionState {
  date: string;
  players: RosterPlayer[];
  // Court labels available tonight, e.g. ["13", "14", "19", "20"].
  courts: string[];
  roundCount: number;
  activeRound: number;
  // Key: `${playerId}::${roundIndex}` (1-based round). Value: court label, or absent for rest.
  assignments: Record<string, string>;

  setDate: (date: string) => void;
  setPlayersFromNames: (names: string[]) => void;
  togglePlayerLevel: (playerId: string) => void;
  removePlayer: (playerId: string) => void;
  setCourts: (labels: string[]) => void;
  setRoundCount: (n: number) => void;
  setActiveRound: (n: number) => void;
  // Place a player on a court for a round. Replaces any previous assignment
  // that round. Returns false if the target court is already full.
  assignToCourt: (
    playerId: string,
    roundIndex: number,
    court: string,
  ) => boolean;
  unassign: (playerId: string, roundIndex: number) => void;
  clearRound: (roundIndex: number) => void;
  resetAll: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

const makeId = () =>
  `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const initialState: Pick<
  SessionState,
  "date" | "players" | "courts" | "roundCount" | "activeRound" | "assignments"
> = {
  date: today(),
  players: [],
  courts: [],
  roundCount: 8,
  activeRound: 1,
  assignments: {},
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
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

      setCourts: (labels) =>
        set((state) => {
          const valid = new Set(labels);
          const assignments = Object.fromEntries(
            Object.entries(state.assignments).filter(([, court]) =>
              valid.has(court),
            ),
          );
          return { courts: labels, assignments };
        }),

      setRoundCount: (n) => {
        const clamped = Math.max(1, Math.min(16, n));
        set((state) => ({
          roundCount: clamped,
          activeRound: Math.min(state.activeRound, clamped),
        }));
      },

      setActiveRound: (n) =>
        set((state) => ({
          activeRound: Math.max(1, Math.min(state.roundCount, n)),
        })),

      assignToCourt: (playerId, roundIndex, court) => {
        const state = get();
        const courtCount = countCourtPlayers(state.assignments, court, roundIndex);
        const currentKey = cellKey(playerId, roundIndex);
        const wasOnCourt = state.assignments[currentKey] === court;
        if (!wasOnCourt && courtCount >= COURT_CAPACITY) {
          return false;
        }
        set((s) => ({
          assignments: { ...s.assignments, [currentKey]: court },
        }));
        return true;
      },

      unassign: (playerId, roundIndex) =>
        set((state) => {
          const key = cellKey(playerId, roundIndex);
          if (!(key in state.assignments)) return state;
          const next = { ...state.assignments };
          delete next[key];
          return { assignments: next };
        }),

      clearRound: (roundIndex) =>
        set((state) => {
          const suffix = `::${roundIndex}`;
          const next: Record<string, string> = {};
          for (const [key, value] of Object.entries(state.assignments)) {
            if (!key.endsWith(suffix)) next[key] = value;
          }
          return { assignments: next };
        }),

      resetAll: () => set({ ...initialState, date: today() }),
    }),
    {
      name: "realg-session-v1",
      version: 2,
      migrate: (persisted, version) => {
        // v1 had no activeRound. Default to 1.
        if (version < 2 && persisted && typeof persisted === "object") {
          return { ...(persisted as object), activeRound: 1 } as SessionState;
        }
        return persisted as SessionState;
      },
    },
  ),
);

export const cellKey = (playerId: string, roundIndex: number) =>
  `${playerId}::${roundIndex}`;

function countCourtPlayers(
  assignments: Record<string, string>,
  court: string,
  roundIndex: number,
): number {
  const suffix = `::${roundIndex}`;
  let n = 0;
  for (const [key, value] of Object.entries(assignments)) {
    if (value === court && key.endsWith(suffix)) n++;
  }
  return n;
}
