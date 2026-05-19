// Map court labels to a stable color so the same court reads the same on every row.
// Mirrors the whiteboard habit of using one marker color per court number.

const PALETTE = [
  { bg: "bg-rose-100", text: "text-rose-700", ring: "ring-rose-300" },
  { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-300" },
  { bg: "bg-sky-100", text: "text-sky-700", ring: "ring-sky-300" },
  { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-300" },
  { bg: "bg-violet-100", text: "text-violet-700", ring: "ring-violet-300" },
  { bg: "bg-teal-100", text: "text-teal-700", ring: "ring-teal-300" },
  { bg: "bg-fuchsia-100", text: "text-fuchsia-700", ring: "ring-fuchsia-300" },
  { bg: "bg-lime-100", text: "text-lime-700", ring: "ring-lime-300" },
];

export type CourtColor = (typeof PALETTE)[number];

export function colorForCourt(label: string): CourtColor {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % PALETTE.length;
  return PALETTE[idx];
}
