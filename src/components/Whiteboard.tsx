import { useMemo, useRef, useState } from "react";
import { useSessionStore, cellKey } from "../store/sessionStore";
import { colorForCourt } from "../utils/courtColors";
import { exportNodeAsPng } from "../utils/exportPng";

// Read-only display of the full schedule across all rounds.
// All editing happens in RoundBuilder; this is the "white board" everyone
// looks at and the surface used for screenshot export.

export function Whiteboard() {
  const players = useSessionStore((s) => s.players);
  const roundCount = useSessionStore((s) => s.roundCount);
  const activeRound = useSessionStore((s) => s.activeRound);
  const assignments = useSessionStore((s) => s.assignments);
  const date = useSessionStore((s) => s.date);

  const boardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

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

  const rounds = Array.from({ length: roundCount }, (_, i) => i + 1);

  const handleExport = async () => {
    const node = boardRef.current;
    if (!node) return;
    setExporting(true);
    try {
      await exportNodeAsPng(node, `realg-${date}.png`);
    } catch (err) {
      console.error(err);
      alert("导出失败，请查看控制台。");
    } finally {
      setExporting(false);
    }
  };

  if (players.length === 0) {
    return (
      <div className="flex items-center justify-center bg-white border border-dashed border-slate-300 rounded-lg p-12 text-slate-400">
        左侧粘贴接龙名单，再设置场地号，白板就会出现在这里。
      </div>
    );
  }

  return (
    <div
      ref={boardRef}
      className="bg-white border border-slate-200 rounded-lg p-4 overflow-auto"
    >
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <h2 className="text-base font-semibold text-slate-800">
          排场白板 · {date}
        </h2>
        <div
          className="flex items-center gap-3"
          data-export="hide"
        >
          <span className="text-xs text-slate-400">
            只读视图 · 编辑请到上方“排场操作台”
          </span>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="bg-slate-800 text-white text-sm rounded px-3 py-1 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting ? "导出中…" : "导出 PNG"}
          </button>
        </div>
      </div>

      <table className="border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-slate-50 border border-slate-200 px-3 py-1.5 text-left font-medium text-slate-600 min-w-[6rem]">
              Name
            </th>
            <th
              className="bg-slate-50 border border-slate-200 px-2 py-1.5 font-medium text-slate-600 w-12"
              data-export="hide"
            >
              次
            </th>
            {rounds.map((r) => (
              <th
                key={r}
                className={
                  "border border-slate-200 px-2 py-1.5 font-medium w-14 " +
                  (r === activeRound
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-50 text-slate-600")
                }
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
              <td
                className="border border-slate-200 px-2 py-1 text-center text-slate-500 tabular-nums"
                data-export="hide"
              >
                {playCounts.get(p.id) ?? 0}
              </td>
              {rounds.map((r) => {
                const court = assignments[cellKey(p.id, r)] ?? "";
                const color = court ? colorForCourt(court) : null;
                const isActive = r === activeRound;
                return (
                  <td
                    key={r}
                    className={
                      "border border-slate-200 text-center w-14 h-9 font-bold tabular-nums " +
                      (color
                        ? `${color.bg} ${color.text}`
                        : isActive
                          ? "bg-amber-50 text-slate-300"
                          : "text-slate-300")
                    }
                  >
                    {court || "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
