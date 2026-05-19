// Core domain models for the badminton scheduling tool.
// These types are the contract between the algorithm, the store, and the UI.

export type PlayerLevel = "A" | "B";

export type AttendanceStatus = "absent" | "arrived" | "left";

export interface Player {
  id: string;
  name: string;
  level: PlayerLevel;
  status: AttendanceStatus;
  playCount: number;
}

export interface Court {
  id: string;
  // Display label, e.g. "13", "19". Drives color coding.
  label: string;
}

// A single 4-player match on a specific court within a round.
export interface Match {
  courtId: string;
  playerIds: [string, string, string, string];
}

export type RoundState = "draft" | "locked";

export interface Round {
  index: number; // 1-based: round 1, 2, 3...
  matches: Match[];
  // Players present this round who didn't get a court.
  restingPlayerIds: string[];
  state: RoundState;
}

// Constraints apply only to the next round being generated, then are cleared.
export type Constraint =
  | { type: "FIXED_FOUR"; playerIds: [string, string, string, string] }
  | { type: "PINNED_TWO"; playerIds: [string, string] };

export interface Session {
  id: string;
  // ISO date string for the night, e.g. "2026-05-21".
  date: string;
  players: Player[];
  courts: Court[];
  rounds: Round[];
  // Constraints staged for the next (not-yet-generated) round.
  pendingConstraints: Constraint[];
}
