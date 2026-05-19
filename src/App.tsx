import { SetupPanel } from "./components/SetupPanel";
import { RoundBuilder } from "./components/RoundBuilder";
import { Whiteboard } from "./components/Whiteboard";

function App() {
  return (
    <div className="min-h-full bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold text-slate-800">
            RealG · 排场助手
          </h1>
          <p className="text-xs text-slate-500">Phase 2 · 以场为中心</p>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[24rem_1fr] gap-4">
        <SetupPanel />
        <div className="space-y-4 min-w-0">
          <RoundBuilder />
          <Whiteboard />
        </div>
      </main>
    </div>
  );
}

export default App;
