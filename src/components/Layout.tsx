// Layout.tsx
import { useState, useRef, useLayoutEffect } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { PDFViewer, type ViewerMode } from "./PDFViewer";

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mode, setMode] = useState<ViewerMode>("VIEWER");

  // Default docs for each mode
  const docMap: Record<Exclude<ViewerMode, null>, string> = {
    VIEWER: "/blob.pdf",
    ANNOTATIONS: "/document.pdf",
    FORMS: "/form.pdf",
    EDITOR: "/editor.pdf",
  };

  // Stores uploaded file per mode
  const [customDocs, setCustomDocs] = useState<
    Partial<Record<Exclude<ViewerMode, null>, string>>
  >({});

  const handleFileUpload = (url: string) => {
    if (!mode) return;
    setCustomDocs((prev) => ({ ...prev, [mode]: url }));
  };

  // If mode is null, fall back to default viewer doc
  const documentUrl = mode ? customDocs[mode] ?? docMap[mode] : "/blob.pdf";

  // --- NEW: measure navbar height and apply padding to the main area ---
  const navWrapperRef = useRef<HTMLDivElement | null>(null);
  const [navHeight, setNavHeight] = useState<number>(0);

  useLayoutEffect(() => {
    const wrapper = navWrapperRef.current;
    if (!wrapper) return;

    const measure = () => {
      try {
        // If Navbar is fixed, the wrapper's bounding box may be 0.
        // So measure the actual rendered navbar element (first child).
        const targetEl = (wrapper.firstElementChild as HTMLElement) ?? wrapper;
        if (!targetEl) {
          setNavHeight(0);
          return;
        }
        const rect = targetEl.getBoundingClientRect();
        setNavHeight(Math.max(0, Math.ceil(rect.height)));
      } catch (e) {
        // fallback
        setNavHeight(0);
      }
    };

    // initial measure after paint
    requestAnimationFrame(measure);

    // use ResizeObserver to watch for navbar size changes (works if navbar is fixed / dynamic)
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measure());
      // observe both wrapper and the child (defensive)
      try {
        ro.observe(wrapper);
        if (wrapper.firstElementChild) ro.observe(wrapper.firstElementChild);
      } catch (e) {
        // ignore observe failures
      }
    } else {
      // fallback: window resize
      window.addEventListener("resize", measure);
    }

    return () => {
      if (ro) {
        ro.disconnect();
      } else {
        window.removeEventListener("resize", measure);
      }
    };
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-100">
      {/* wrapper around Navbar so we can measure the real rendered navbar element */}
      <div ref={navWrapperRef} style={{ zIndex: 50 }}>
        <Navbar />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          onSelectMode={(m) => setMode(m)}
          activeMode={mode}
          onFileUpload={handleFileUpload}
        />

        {/* apply paddingTop equal to navbar height so the viewer and toolbar sit below it */}
        <main
          className="relative flex-1 overflow-hidden"
          style={{ paddingTop: navHeight }}
        >
          <PDFViewer mode={mode} documentUrl={documentUrl} />
        </main>
      </div>
    </div>
  );
}
