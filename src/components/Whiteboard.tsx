import { forwardRef, useMemo, useState } from "react";
import { useSessionStore, cellKey } from "../store/sessionStore";
import { colorForCourt } from "../utils/courtColors";

// A two-section whiteboard: A-level players on top, B-level on bottom,
// echoing the physical layout of the two boards in the club.

export const Whiteboard = forwardRef<HTMLDivElement>(function Whiteboard(
  _props,
  ref,
) {
  const players = useSessionStore((s) => s.players);
  const courts = useSessionStore((s) => s.courts);
  const roundCount = useSessionStore((s) => s.roundCount);
  const assignments = useSessionStore((s) => s.assignments);
  const date = useSessionStore((s) => s.date);

  const playCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of players) counts.set(p.id, 0);
    for (const [key, court] of Object.entries(assignments)) {
      if (!court) continue;
      const [pid] = key.split("::");
      counts.set(pid, (counts.get(pid) ?? 0) + 1);
    }
    return counts;
  }, [players, assignments]);

  const aPlayers = players.filter((p) => p.level === "A");
  const bPlayers = players.filter((p) => p.level === "B");

  const rounds = Array.from({ length: roundCount }, (_, i) => i + 1);

  if (players.length === 0) {
    return (
      <div
        ref={ref}
        className="flex-1 flex items-center justify-center bg-white border border-dashed border-slate-300 rounded-lg p-12 text-slate-400"
      >
        左侧粘贴接龙名单，再设置场地号，白板就会出现在这里。
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="bg-white border border-slate-200 rounded-lg p-4 overflow-auto"
    >
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-800">
          排场白板 · {date}
        </h2>
        <span className="text-xs text-slate-400">
          点击格子选择场地号或休息
        </span>
      </div>

      {aPlayers.length > 0 && (
        <Section
          title="A 级"
          players={aPlayers}
          rounds={rounds}
          courts={courts}
          assignments={assignments}
          playCounts={playCounts}
        />
      )}
      {aPlayers.length > 0 && bPlayers.length > 0 && (
        <div className="h-3" />
      )}
      {bPlayers.length > 0 && (
        <Section
          title="B 级"
          players={bPlayers}
          rounds={rounds}
          courts={courts}
          assignments={assignments}
          playCounts={playCounts}
        />
      )}
    </div>
  );
});

interface SectionProps {
  title: string;
  players: { id: string; name: string }[];
  rounds: number[];
  courts: string[];
  assignments: Record<string, string>;
  playCounts: Map<string, number>;
}

function Section({
  title,
  players,
  rounds,
  courts,
  assignments,
  playCounts,
}: SectionProps) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
        {title} · {players.length} 人
      </div>
      <table className="border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-slate-50 border border-slate-200 px-3 py-1.5 text-left font-medium text-slate-600 min-w-[6rem]">
              Name
            </th>
            <th className="bg-slate-50 border border-slate-200 px-2 py-1.5 font-medium text-slate-600 w-12">
              次
            </th>
            {rounds.map((r) => (
              <th
                key={r}
                className="bg-slate-50 border border-slate-200 px-2 py-1.5 font-medium text-slate-600 w-14"
              >
                {r}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id}>
              <td className="sticky left-0 bg-white border border-slate-200 px-3 py-1 text-slate-800 font-medium">
                {p.name}
              </td>
              <td className="border border-slate-200 px-2 py-1 text-center text-slate-500 tabular-nums">
                {playCounts.get(p.id) ?? 0}
              </td>
              {rounds.map((r) => (
                <Cell
                  key={r}
                  playerId={p.id}
                  roundIndex={r}
                  court={assignments[cellKey(p.id, r)] ?? ""}
                  courts={courts}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface CellProps {
  playerId: string;
  roundIndex: number;
  court: string;
  courts: string[];
}

function Cell({ playerId, roundIndex, court, courts }: CellProps) {
  const setAssignment = useSessionStore((s) => s.setAssignment);
  const [open, setOpen] = useState(false);

  const color = court ? colorForCourt(court) : null;

  return (
    <td className="border border-slate-200 p-0 text-center relative w-14 h-9">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          "w-full h-full px-1 py-1 font-bold tabular-nums transition " +
          (color
            ? `${color.bg} ${color.text} hover:brightness-95`
            : "text-slate-300 hover:bg-slate-50")
        }
      >
        {court || "—"}
      </button>
      {open && (
        <CellPicker
          courts={courts}
          current={court}
          onPick={(value) => {
            setAssignment(playerId, roundIndex, value);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </td>
  );
}

interface PickerProps {
  courts: string[];
  current: string;
  onPick: (value: string) => void;
  onClose: () => void;
}

function CellPicker({ courts, current, onPick, onClose }: PickerProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-10"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute z-20 left-1/2 top-full -translate-x-1/2 mt-1 bg-white border border-slate-200 rounded-md shadow-lg p-1.5 flex flex-wrap gap-1 min-w-max">
        <button
          type="button"
          onClick={() => onPick("")}
          className={
            "px-2 py-1 rounded text-xs " +
            (!current
              ? "bg-slate-200 text-slate-700"
              : "text-slate-500 hover:bg-slate-100")
          }
        >
          休息
        </button>
        {courts.length === 0 && (
          <span className="text-xs text-slate-400 px-2 py-1">
            尚未设置场地
          </span>
        )}
        {courts.map((label) => {
          const c = colorForCourt(label);
          const isCurrent = current === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onPick(label)}
              className={
                `px-2 py-1 rounded text-xs font-bold tabular-nums ${c.bg} ${c.text} ` +
                (isCurrent ? `ring-2 ${c.ring}` : "hover:brightness-95")
              }
            >
              {label}
            </button>
          );
        })}
      </div>
    </>
  );
}
