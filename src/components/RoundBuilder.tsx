import { useMemo, useState } from "react";
import {
  COURT_CAPACITY,
  cellKey,
  useSessionStore,
} from "../store/sessionStore";
import { colorForCourt } from "../utils/courtColors";

// The "deal cards" view. The organizer picks a court (auto-selected as the
// next non-full one) then taps resting players to fill it. Tapping a placed
// player sends them back to the rest pool.
//
// Mobile: rest pool is a sticky-bottom drawer so courts and the pool are
// always both visible — no scrolling between them.
// Desktop: rest pool is inline below the courts (current behavior).

export function RoundBuilder() {
  const players = useSessionStore((s) => s.players);
  const courts = useSessionStore((s) => s.courts);
  const roundCount = useSessionStore((s) => s.roundCount);
  const activeRound = useSessionStore((s) => s.activeRound);
  const assignments = useSessionStore((s) => s.assignments);
  const setActiveRound = useSessionStore((s) => s.setActiveRound);
  const assignToCourt = useSessionStore((s) => s.assignToCourt);
  const unassign = useSessionStore((s) => s.unassign);
  const clearRound = useSessionStore((s) => s.clearRound);

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

  const roundByCourt = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const c of courts) map.set(c, []);
    for (const [key, court] of Object.entries(assignments)) {
      const [pid, rIdx] = key.split("::");
      if (Number(rIdx) !== activeRound) continue;
      if (!map.has(court)) continue;
      map.get(court)!.push(pid);
    }
    return map;
  }, [assignments, courts, activeRound]);

  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);

  const activeCourt: string | null = useMemo(() => {
    const isFull = (c: string) =>
      (roundByCourt.get(c)?.length ?? 0) >= COURT_CAPACITY;
    if (
      selectedCourt &&
      courts.includes(selectedCourt) &&
      !isFull(selectedCourt)
    ) {
      return selectedCourt;
    }
    return courts.find((c) => !isFull(c)) ?? null;
  }, [selectedCourt, courts, roundByCourt]);

  const restingPlayers = useMemo(() => {
    return players
      .filter((p) => !assignments[cellKey(p.id, activeRound)])
      .sort((a, b) => {
        const ca = playCounts.get(a.id) ?? 0;
        const cb = playCounts.get(b.id) ?? 0;
        if (ca !== cb) return ca - cb;
        return a.name.localeCompare(b.name);
      });
  }, [players, assignments, activeRound, playCounts]);

  const restedLastRound = useMemo(() => {
    const set = new Set<string>();
    if (activeRound <= 1) return set;
    const prev = activeRound - 1;
    for (const p of players) {
      if (!assignments[cellKey(p.id, prev)]) set.add(p.id);
    }
    return set;
  }, [players, assignments, activeRound]);

  const playerById = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players],
  );

  const handlePlaceResting = (playerId: string) => {
    if (!activeCourt) return;
    assignToCourt(playerId, activeRound, activeCourt);
  };

  const handleRemovePlaced = (playerId: string) => {
    unassign(playerId, activeRound);
  };

  const handleClearRound = () => {
    if (!confirm(`清空第 ${activeRound} 轮所有安排？`)) return;
    clearRound(activeRound);
  };

  if (players.length === 0 || courts.length === 0) {
    return (
      <section className="bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-500">
        <p className="font-medium text-slate-700 mb-1">
          排场操作台还没准备好
        </p>
        <p className="text-sm">
          先在「设置」里录入玩家名单和场地号，再回来排场。
        </p>
      </section>
    );
  }

  const totalPlaced = courts.reduce(
    (sum, c) => sum + (roundByCourt.get(c)?.length ?? 0),
    0,
  );

  return (
    <>
      <section className="bg-white border border-slate-200 rounded-lg p-3 lg:p-4 space-y-3 lg:space-y-4">
        <header className="flex flex-wrap items-center gap-2 lg:gap-3 justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-800">
              排场操作台
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 hidden lg:block">
              点击休息池里的玩家把他放进当前选中的场，再点已上场的玩家把他撤下来。
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 tabular-nums">
              {totalPlaced} / {courts.length * COURT_CAPACITY}
            </span>
            <button
              type="button"
              onClick={handleClearRound}
              className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1 rounded hover:bg-rose-50"
            >
              清空本轮
            </button>
          </div>
        </header>

        <RoundTabs
          roundCount={roundCount}
          activeRound={activeRound}
          onSelect={setActiveRound}
        />

        <div className="grid gap-2 lg:gap-3 grid-cols-2 lg:[grid-template-columns:repeat(auto-fill,minmax(min(100%,14rem),1fr))]">
          {courts.map((court) => {
            const slotIds = roundByCourt.get(court) ?? [];
            const isActive = court === activeCourt;
            const isFull = slotIds.length >= COURT_CAPACITY;
            return (
              <CourtCard
                key={court}
                court={court}
                slotIds={slotIds}
                playerById={playerById}
                restedLastRound={restedLastRound}
                isActive={isActive}
                isFull={isFull}
                onSelect={() => setSelectedCourt(court)}
                onRemovePlayer={handleRemovePlaced}
              />
            );
          })}
        </div>

        {/* Desktop: inline rest pool */}
        <div className="hidden lg:block">
          <RestPool
            restingPlayers={restingPlayers}
            playCounts={playCounts}
            restedLastRound={restedLastRound}
            canPlace={!!activeCourt}
            onPlace={handlePlaceResting}
            variant="inline"
          />
        </div>
      </section>

      {/* Mobile: sticky-bottom rest pool drawer */}
      <div className="lg:hidden">
        <StickyRestPool
          restingPlayers={restingPlayers}
          playCounts={playCounts}
          restedLastRound={restedLastRound}
          canPlace={!!activeCourt}
          activeCourt={activeCourt}
          onPlace={handlePlaceResting}
        />
      </div>
    </>
  );
}

interface RoundTabsProps {
  roundCount: number;
  activeRound: number;
  onSelect: (n: number) => void;
}

function RoundTabs({ roundCount, activeRound, onSelect }: RoundTabsProps) {
  const rounds = Array.from({ length: roundCount }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 lg:flex-wrap lg:overflow-visible">
      <span className="text-xs text-slate-500 mr-1 shrink-0">轮次</span>
      {rounds.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onSelect(r)}
          className={
            "shrink-0 min-w-[2rem] px-2 py-1 rounded text-sm font-semibold tabular-nums " +
            (r === activeRound
              ? "bg-slate-800 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200")
          }
        >
          {r}
        </button>
      ))}
    </div>
  );
}

interface CourtCardProps {
  court: string;
  slotIds: string[];
  playerById: Map<string, { id: string; name: string; level: "A" | "B" }>;
  restedLastRound: Set<string>;
  isActive: boolean;
  isFull: boolean;
  onSelect: () => void;
  onRemovePlayer: (playerId: string) => void;
}

function CourtCard({
  court,
  slotIds,
  playerById,
  restedLastRound,
  isActive,
  isFull,
  onSelect,
  onRemovePlayer,
}: CourtCardProps) {
  const color = colorForCourt(court);
  const padded: (string | null)[] = [...slotIds];
  while (padded.length < COURT_CAPACITY) padded.push(null);

  return (
    <div
      className={
        "rounded-lg border-2 p-1.5 lg:p-2 transition cursor-pointer " +
        (isActive
          ? `${color.ring} ring-2 border-transparent ${color.bg}`
          : isFull
            ? "border-slate-200 bg-slate-50 opacity-70"
            : "border-slate-200 bg-white hover:border-slate-300")
      }
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span
          className={`font-bold tabular-nums text-base lg:text-lg ${color.text}`}
          aria-label={`${court}号场`}
        >
          {court}
        </span>
        <span className="text-[10px] lg:text-[11px] text-slate-500">
          {slotIds.length}/{COURT_CAPACITY}
          {isActive && (
            <span className="ml-1 lg:ml-1.5 text-slate-700 font-semibold">
              · 当前
            </span>
          )}
          {isFull && !isActive && <span className="ml-1 lg:ml-1.5">满</span>}
        </span>
      </div>
      <ul className="space-y-1">
        {padded.map((pid, idx) => {
          if (pid) {
            const p = playerById.get(pid);
            if (!p) return null;
            const restedLast = restedLastRound.has(pid);
            return (
              <li key={pid}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePlayer(pid);
                  }}
                  title={restedLast ? "上一轮在休息" : undefined}
                  className={
                    "w-full flex items-center gap-1 lg:gap-1.5 border rounded px-1.5 lg:px-2 py-1 text-sm group " +
                    (restedLast
                      ? "bg-amber-50 border-amber-400 hover:bg-amber-100"
                      : "bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50")
                  }
                >
                  <LevelBadge level={p.level} />
                  <span className="flex-1 text-left truncate text-slate-800">
                    {p.name}
                  </span>
                  {restedLast && (
                    <span
                      className="text-[9px] font-bold text-amber-700 bg-amber-200 px-1 rounded leading-none py-0.5"
                      aria-label="上一轮在休息"
                    >
                      休
                    </span>
                  )}
                  <span className="text-slate-300 group-hover:text-rose-500 text-base leading-none">
                    ×
                  </span>
                </button>
              </li>
            );
          }
          return (
            <li
              key={`empty-${idx}`}
              className="border border-dashed border-slate-300 rounded px-2 py-1 text-xs text-slate-400 text-center bg-white/60"
            >
              空位
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface RestPoolProps {
  restingPlayers: { id: string; name: string; level: "A" | "B" }[];
  playCounts: Map<string, number>;
  restedLastRound: Set<string>;
  canPlace: boolean;
  onPlace: (playerId: string) => void;
  variant: "inline" | "drawer";
}

function RestPool({
  restingPlayers,
  playCounts,
  restedLastRound,
  canPlace,
  onPlace,
  variant,
}: RestPoolProps) {
  const flaggedCount = restingPlayers.filter((p) =>
    restedLastRound.has(p.id),
  ).length;

  return (
    <div className={variant === "inline" ? "border-t border-slate-200 pt-3" : ""}>
      {variant === "inline" && (
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-700">
            休息池 · {restingPlayers.length} 人
            {flaggedCount > 0 && (
              <span className="ml-2 text-xs font-normal text-amber-700">
                · {flaggedCount} 人上轮已休
              </span>
            )}
          </h3>
          <span className="text-xs text-slate-400">
            {canPlace ? "点击玩家加入当前选中场" : "所有场已满"}
          </span>
        </div>
      )}
      {restingPlayers.length === 0 ? (
        <p className="text-xs text-slate-400 italic">本轮所有玩家都已上场。</p>
      ) : (
        <ul
          className="grid gap-1.5"
          style={{
            gridTemplateColumns:
              "repeat(auto-fill, minmax(8.5rem, 1fr))",
          }}
        >
          {restingPlayers.map((p) => {
            const count = playCounts.get(p.id) ?? 0;
            const restedLast = restedLastRound.has(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onPlace(p.id)}
                  disabled={!canPlace}
                  title={restedLast ? "上一轮也在休息" : undefined}
                  className={
                    "relative w-full inline-flex items-center gap-1.5 border-2 rounded-md pl-1.5 pr-2 py-1.5 text-sm transition text-left " +
                    (!canPlace
                      ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                      : restedLast
                        ? "border-amber-400 bg-amber-50 hover:bg-amber-100 text-slate-800"
                        : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 text-slate-800")
                  }
                >
                  <LevelBadge level={p.level} />
                  <span className="flex-1 truncate">{p.name}</span>
                  {restedLast && (
                    <span
                      className="text-[9px] font-bold text-amber-700 bg-amber-200 px-1 rounded leading-none py-0.5"
                      aria-label="上一轮在休息"
                    >
                      休
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                    {count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface StickyRestPoolProps {
  restingPlayers: { id: string; name: string; level: "A" | "B" }[];
  playCounts: Map<string, number>;
  restedLastRound: Set<string>;
  canPlace: boolean;
  activeCourt: string | null;
  onPlace: (playerId: string) => void;
}

function StickyRestPool({
  restingPlayers,
  playCounts,
  restedLastRound,
  canPlace,
  activeCourt,
  onPlace,
}: StickyRestPoolProps) {
  const [expanded, setExpanded] = useState(false);
  const flaggedCount = restingPlayers.filter((p) =>
    restedLastRound.has(p.id),
  ).length;

  const courtColor = activeCourt ? colorForCourt(activeCourt) : null;

  return (
    <div
      className={
        "fixed left-0 right-0 bottom-0 z-30 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(15,23,42,0.06)] flex flex-col transition-[height] duration-200 " +
        (expanded ? "h-[70vh]" : "h-[28vh] max-h-[20rem]")
      }
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="shrink-0 flex items-center justify-between px-3 py-2 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="block w-10 h-1 bg-slate-300 rounded-full mr-1" />
          <span className="text-sm font-semibold text-slate-800">
            休息池 · {restingPlayers.length}
          </span>
          {flaggedCount > 0 && (
            <span className="text-[11px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
              {flaggedCount} 人上轮已休
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs text-slate-500">
          {activeCourt && courtColor ? (
            <span className="flex items-center gap-1">
              <span>下一位 →</span>
              <span
                className={`font-bold tabular-nums ${courtColor.text} ${courtColor.bg} rounded px-1.5 py-0.5`}
              >
                {activeCourt}
              </span>
            </span>
          ) : (
            <span>所有场已满</span>
          )}
          <span aria-hidden="true">{expanded ? "▾" : "▴"}</span>
        </div>
      </button>

      <div className="flex-1 overflow-y-auto px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        {restingPlayers.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            本轮所有玩家都已上场。
          </p>
        ) : (
          <ul
            className="grid gap-1.5 pb-2"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(7.5rem, 1fr))",
            }}
          >
            {restingPlayers.map((p) => {
              const count = playCounts.get(p.id) ?? 0;
              const restedLast = restedLastRound.has(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onPlace(p.id)}
                    disabled={!canPlace}
                    className={
                      "relative w-full inline-flex items-center gap-1.5 border-2 rounded-md pl-1.5 pr-2 py-2 text-sm transition text-left " +
                      (!canPlace
                        ? "border-slate-100 bg-slate-50 text-slate-400"
                        : restedLast
                          ? "border-amber-400 bg-amber-50 active:bg-amber-100 text-slate-800"
                          : "border-slate-200 bg-white active:bg-slate-50 text-slate-800")
                    }
                  >
                    <LevelBadge level={p.level} />
                    <span className="flex-1 truncate">{p.name}</span>
                    {restedLast && (
                      <span
                        className="text-[9px] font-bold text-amber-700 bg-amber-200 px-1 rounded leading-none py-0.5"
                        aria-label="上一轮在休息"
                      >
                        休
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                      {count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function LevelBadge({ level }: { level: "A" | "B" }) {
  return (
    <span
      className={
        "inline-flex w-4 h-4 items-center justify-center rounded text-[10px] font-bold " +
        (level === "A"
          ? "bg-rose-500 text-white"
          : "bg-slate-200 text-slate-700")
      }
    >
      {level}
    </span>
  );
}
