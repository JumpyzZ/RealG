import { domToPng } from "modern-screenshot";

// Elements with `data-export="hide"` are dropped during PNG export so the
// shared image stays minimal (no chrome, no editor hints).
export async function exportNodeAsPng(
  node: HTMLElement,
  filename: string,
): Promise<void> {
  const dataUrl = await domToPng(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    filter: (el) => {
      if (el instanceof HTMLElement && el.dataset.export === "hide") {
        return false;
      }
      return true;
    },
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
