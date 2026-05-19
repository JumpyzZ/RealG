import { useState } from "react";
import { useSessionStore } from "../store/sessionStore";
import { parseRoster } from "../utils/roster";

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
        <label className="block">
          <span className="text-slate-600">场地号（逗号或空格分隔）</span>
          <input
            type="text"
            value={courtsText}
            onChange={(e) => setCourtsText(e.target.value)}
            onBlur={handleApplyCourts}
            placeholder="13, 14, 19, 20"
            className="mt-1 w-full border border-slate-300 rounded px-2 py-1 font-mono"
          />
        </label>
        <button
          type="button"
          onClick={handleApplyCourts}
          className="mt-2 w-full bg-slate-100 text-slate-700 rounded px-3 py-1.5 text-xs font-medium hover:bg-slate-200"
        >
          应用场地
        </button>
      </div>

      <label className="block">
        <span className="text-slate-600">轮次数（列数）</span>
        <input
          type="number"
          min={1}
          max={16}
          value={roundCount}
          onChange={(e) => setRoundCount(Number(e.target.value) || 1)}
          className="mt-1 w-full border border-slate-300 rounded px-2 py-1"
        />
      </label>
    </aside>
  );
}
