import { useRef, useState } from "react";
import { SetupPanel } from "./components/SetupPanel";
import { Whiteboard } from "./components/Whiteboard";
import { useSessionStore } from "./store/sessionStore";
import { exportNodeAsPng } from "./utils/exportPng";

function App() {
  const boardRef = useRef<HTMLDivElement>(null);
  const date = useSessionStore((s) => s.date);
  const playerCount = useSessionStore((s) => s.players.length);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!boardRef.current) return;
    setExporting(true);
    try {
      await exportNodeAsPng(boardRef.current, `realg-${date}.png`);
    } catch (err) {
      console.error(err);
      alert("导出失败，请查看控制台。");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              RealG · 排场助手
            </h1>
            <p className="text-xs text-slate-500">Phase 1 · 静态白板</p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={playerCount === 0 || exporting}
            className="bg-slate-800 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting ? "导出中…" : "导出 PNG"}
          </button>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[24rem_1fr] gap-4">
        <SetupPanel />
        <Whiteboard ref={boardRef} />
      </main>
    </div>
  );
}

export default App;
