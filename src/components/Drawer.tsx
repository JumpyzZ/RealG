import { useEffect } from "react";

interface DrawerProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

// Right-side slide-in drawer used for the settings panel on mobile.
export function Drawer({ open, title, onClose, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div
        className={
          "fixed inset-0 z-40 bg-slate-900/40 transition-opacity " +
          (open ? "opacity-100" : "opacity-0 pointer-events-none")
        }
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={
          "fixed top-0 right-0 z-50 h-full w-[88vw] max-w-sm bg-slate-50 shadow-xl transition-transform overflow-y-auto " +
          (open ? "translate-x-0" : "translate-x-full")
        }
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">{title ?? "设置"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 text-xl leading-none px-2"
            aria-label="关闭"
          >
            ×
          </button>
        </div>
        <div className="p-3">{children}</div>
      </aside>
    </>
  );
}
