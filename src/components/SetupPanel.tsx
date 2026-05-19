import { useEffect, useState } from "react";
import { useSessionStore } from "../store/sessionStore";
import { parseRoster } from "../utils/roster";
import { colorForCourt } from "../utils/courtColors";

export function SetupPanel() {
  const date = useSessionStore((s) => s.date);
  const players = useSessionStore((s) => s.players);
  const courts = useSessionStore((s) => s.courts);
  const roundCount = useSessionStore((s) => s.roundCount);
  const setDate = useSessionStore((s) => s.setDate);
  const setPlayersFromNames = useSessionStore((s) => s.setPlayersFromNames);
  const togglePlayerLevel = useSessionStore((s) => s.togglePlayerLevel);
  const removePlayer = useSessionStore((s) => s.removePlayer);
  const setCourts = useSessionStore((s) => s.setCourts);
  const setRoundCount = useSessionStore((s) => s.setRoundCount);
  const resetAll = useSessionStore((s) => s.resetAll);

  const [rosterText, setRosterText] = useState("");
  const [courtsText, setCourtsText] = useState(courts.join(", "));

  // Keep the input in sync when the store changes (e.g. after resetAll).
  useEffect(() => {
    setCourtsText(courts.join(", "));
  }, [courts]);

  const handleApplyRoster = () => {
    const names = parseRoster(rosterText);
    if (names.length === 0) return;
    setPlayersFromNames(names);
    setRosterText("");
  };

  const handleApplyCourts = () => {
    const labels = courtsText
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    setCourts(labels);
  };

  const handleReset = () => {
    if (confirm("确定清空当前场次的全部数据吗？")) {
      resetAll();
      setRosterText("");
      setCourtsText("");
    }
  };

  const aCount = players.filter((p) => p.level === "A").length;
  const bCount = players.length - aCount;

  return (
    <aside className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">场次设置</h2>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-slate-500 hover:text-rose-600"
        >
          清空
        </button>
      </div>

      <label className="block">
        <span className="text-slate-600">日期</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full border border-slate-300 rounded px-2 py-1"
        />
      </label>

      <div>
        <label className="block">
          <span className="text-slate-600">名单（粘贴接龙文本）</span>
          <textarea
            value={rosterText}
            onChange={(e) => setRosterText(e.target.value)}
            placeholder={"1. a\n2. ht7\n3. shen\n..."}
            rows={5}
            className="mt-1 w-full border border-slate-300 rounded px-2 py-1 font-mono text-xs"
          />
        </label>
        <button
          type="button"
          onClick={handleApplyRoster}
          disabled={!rosterText.trim()}
          className="mt-2 w-full bg-slate-800 text-white rounded px-3 py-1.5 text-xs font-medium hover:bg-slate-700 disabled:opacity-40"
        >
          解析并应用
        </button>
      </div>

      {players.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>
              玩家 · {players.length} 人（A {aCount} / B {bCount}）
            </span>
            <span className="text-slate-400">点击切换等级</span>
          </div>
          <ul className="grid grid-cols-2 gap-1 border border-slate-200 rounded p-1 bg-slate-50">
            {players.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between bg-white border border-slate-100 rounded px-1.5 py-1 min-w-0"
              >
                <button
                  type="button"
                  onClick={() => togglePlayerLevel(p.id)}
                  className="flex items-center gap-1.5 flex-1 text-left min-w-0"
                >
                  <span
                    className={
                      "shrink-0 inline-flex w-5 h-5 items-center justify-center rounded text-[10px] font-bold " +
                      (p.level === "A"
                        ? "bg-rose-500 text-white"
                        : "bg-slate-200 text-slate-700")
                    }
                  >
                    {p.level}
                  </span>
                  <span className="text-slate-800 truncate text-xs">
                    {p.name}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => removePlayer(p.id)}
                  className="shrink-0 text-slate-300 hover:text-rose-500 text-base leading-none px-1"
                  aria-label={`删除 ${p.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-slate-600">
            场地 · {courts.length} 块
          </span>
          {courts.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end">
              {courts.map((label) => {
                const c = colorForCourt(label);
                return (
                  <span
                    key={label}
                    className={`text-xs font-bold tabular-nums px-1.5 py-0.5 rounded ${c.bg} ${c.text}`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <label className="block">
          <span className="sr-only">场地号（逗号或空格分隔）</span>
          <input
            type="text"
            value={courtsText}
            onChange={(e) => setCourtsText(e.target.value)}
            onBlur={handleApplyCourts}
            placeholder="14, 15, 16, 19, 20, 21"
            className="w-full border border-slate-300 rounded px-2 py-1 font-mono"
          />
        </label>
        <p className="mt-1 text-xs text-slate-400">
          逗号或空格分隔，回车或失焦自动应用
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-600">轮次</span>
          <span className="text-sm font-semibold text-slate-800 tabular-nums">
            {roundCount} 局
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRoundCount(roundCount - 1)}
            disabled={roundCount <= 1}
            className="w-9 h-9 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-lg font-semibold disabled:opacity-40"
            aria-label="减少一局"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={16}
            value={roundCount}
            onChange={(e) => setRoundCount(Number(e.target.value) || 1)}
            className="flex-1 min-w-0 border border-slate-300 rounded px-2 py-1 text-center tabular-nums"
          />
          <button
            type="button"
            onClick={() => setRoundCount(roundCount + 1)}
            disabled={roundCount >= 16}
            className="w-9 h-9 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-lg font-semibold disabled:opacity-40"
            aria-label="增加一局"
          >
            +
          </button>
        </div>
      </div>
    </aside>
  );
}
