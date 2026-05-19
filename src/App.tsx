import { useState } from "react";
import { SetupPanel } from "./components/SetupPanel";
import { RoundBuilder } from "./components/RoundBuilder";
import { Whiteboard } from "./components/Whiteboard";
import { Drawer } from "./components/Drawer";

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-full bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              RealG · 排场助手
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Phase 2 · 以场为中心
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded px-3 py-1.5"
            aria-label="打开设置"
          >
            <span aria-hidden="true">⚙️</span>
            <span>设置</span>
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-3 lg:px-4 py-3 lg:py-4 grid grid-cols-1 lg:grid-cols-[24rem_1fr] gap-4 pb-[40vh] lg:pb-4">
        <div className="hidden lg:block">
          <SetupPanel />
        </div>
        <div className="space-y-4 min-w-0">
          <RoundBuilder />
          <Whiteboard />
        </div>
      </main>

      <Drawer
        open={settingsOpen}
        title="场次设置"
        onClose={() => setSettingsOpen(false)}
      >
        <SetupPanel />
      </Drawer>
    </div>
  );
}

export default App;
