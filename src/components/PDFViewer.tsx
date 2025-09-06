import { useEffect, useRef, useState } from "react";

export type ViewerMode = "VIEWER" | "ANNOTATIONS" | "FORMS" | "EDITOR" | null;

interface PDFViewerProps {
  mode?: ViewerMode;
  documentUrl?: string;
  onInstanceLoad?: (instance: any) => void;
}

export function PDFViewer({
  mode = null,
  documentUrl = "/document.pdf",
  onInstanceLoad,
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<any>(null);
  const libRef = useRef<any>(null);
  const pendingModeRef = useRef<ViewerMode>(mode);
  const isDocumentReadyRef = useRef(false);
  const modeQueueRef = useRef<ViewerMode[]>([]);
  const [isContainerReady, setIsContainerReady] = useState(false);

  // small mount delay so Tailwind / layout can settle (keep this)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        setIsContainerReady(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Helper to apply mode (unchanged)
  const applyModeToInstance = (modeToApply: ViewerMode, instance: any, NutrientViewer: any) => {
    if (!instance || !NutrientViewer) return;

    try {
      switch (modeToApply) {
        case "ANNOTATIONS":
          instance.setViewState((vs: any) =>
            vs.set("sidebarMode", NutrientViewer.SidebarMode.ANNOTATIONS).set("interactionMode", null)
          );

          const annotationsAllowedTypes = [
            "sidebar-annotations", "pager", "pan", "zoom-out", "zoom-in", "spacer",
            "ink", "text", "note", "image", "line", "ink-highlighter", "arrow",
            "rectangle", "ellipse", "polygon", "polyline",
          ];

          const annotationsItems = annotationsAllowedTypes
            .map(type =>
              NutrientViewer.defaultToolbarItems.find((item: any) => item.type === type) ||
              (type === "spacer" ? { type: "spacer" } : null)
            )
            .filter(Boolean);

          instance.setToolbarItems(annotationsItems);
          break;

        case "FORMS":
          instance.setViewState((vs: any) =>
            vs.set("formDesignMode", true).set("sidebarMode", null).set("interactionMode", null)
          );

          const formsAllowedTypes = [
            "sidebar-thumbnails", "sidebar-document-outline", "sidebar-annotations",
            "sidebar-signatures", "sidebar-layers", "pager", "pan", "zoom-out", "zoom-in",
            "spacer", "sidebar-forms", "print", "export-pdf"
          ];

          const formsItems = formsAllowedTypes
            .map(type =>
              NutrientViewer.defaultToolbarItems.find((item: any) => item.type === type) ||
              (type === "spacer" ? { type: "spacer" } : null)
            )
            .filter(Boolean);

          instance.setToolbarItems(formsItems);
          break;

        case "EDITOR":
          instance.setViewState((vs: any) =>
            vs.set("interactionMode", null).set("sidebarMode", null)
          );

          const editorAllowedTypes = [
            "sidebar-annotations", "pager", "pan", "zoom-out", "zoom-in", "spacer",
            "document-editor", "print", "export-pdf",
          ];

          const editorItems = editorAllowedTypes
            .map(type =>
              NutrientViewer.defaultToolbarItems.find((item: any) => item.type === type) ||
              (type === "spacer" ? { type: "spacer" } : null)
            )
            .filter(Boolean)
            .map((item: any) => {
              const clone = { ...item };
              if (clone.type === "document-editor") {
                clone.selected = false;
              }
              return clone;
            });

          instance.setToolbarItems(editorItems);
          break;

        case "VIEWER":
        default:
          // important: do NOT force sidebarMode to null if toolbar contains sidebar items
          instance.setViewState((vs: any) =>
            vs.set("interactionMode", null)
          );

          const allowedTypes = [
             "sidebar-document-outline", "sidebar-annotations",
            "sidebar-signatures", "sidebar-layers", "pager", "pan", "zoom-out", "zoom-in",
            "zoom-mode", "spacer", "search", "export-pdf", "print"
          ];

          const filteredItems = allowedTypes
            .map(type => NutrientViewer.defaultToolbarItems.find((item: any) => item.type === type) || (type === "spacer" ? { type: "spacer" } : null))
            .filter(Boolean);

          instance.setToolbarItems(filteredItems);
          break;
      }
    } catch (err) {
      console.error("applyModeToInstance error:", err);
    }
  };

  // Utility: wait for container to be in DOM, sized, and positioned (prevents FrameProvider warnings)
  const waitForContainerReadyDom = (container: HTMLElement | null, timeoutMs = 2000) => {
    return new Promise<boolean>((resolve) => {
      if (!container) return resolve(false);
      const start = performance.now();

      const check = () => {
        // stop if timed out
        if (performance.now() - start > timeoutMs) return resolve(true); // fallback: continue anyway

        // must be in document
        if (!document.contains(container)) {
          requestAnimationFrame(check);
          return;
        }

        const cs = window.getComputedStyle(container);
        const rect = container.getBoundingClientRect();

        // require width/height > 0 and non-static position; if not ready, retry
        if ((rect.width > 0 && rect.height > 0) && cs.position !== "static") {
          return resolve(true);
        }

        requestAnimationFrame(check);
      };

      check();
    });
  };

  // Load / reload viewer (improved: wait for container readiness and defensive handlers)
  useEffect(() => {
    if (!isContainerReady) return;

    let disposed = false;
    const loadId = Symbol();
    const currentLoadId = loadId;

    // defensive click-capture (safety net to avoid scroll-chaining)
    let onClickCapture: ((e: MouseEvent) => void) | null = null;

    (async () => {
      try {
        const imported = await import("@nutrient-sdk/viewer");
        const NutrientViewer: any = imported?.default ?? imported;
        libRef.current = NutrientViewer;

        const container = containerRef.current;
        if (!container) return;

        // wait until container is attached, sized, and positioned (prevents portal/container warnings)
        await waitForContainerReadyDom(container, 2000);

        // tiny extra delay to let CSS/Tailwind finish layout
        await new Promise((r) => setTimeout(r, 40));

        // Unload previous instance safely
        try {
          NutrientViewer.unload(container);
        } catch (error) {
          console.warn("Previous unload error (likely first load):", error);
        }

        console.log("Nutrient: loading document:", documentUrl);

        // prepare document param (support blob:)
        let docParam: any = documentUrl;
        if (documentUrl.startsWith("blob:")) {
          try {
            const response = await fetch(documentUrl);
            const arrayBuffer = await response.arrayBuffer();
            docParam = arrayBuffer;
          } catch {
            docParam = documentUrl;
          }
        }

        // Load the SDK normally (do NOT pass any unsupported custom portalContainer)
        const instance = await NutrientViewer.load({
          container,
          document: docParam,
          baseUrl: `${window.location.protocol}//${window.location.host}/${import.meta.env.PUBLIC_URL ?? ""}`,
        });

        if (disposed || currentLoadId !== loadId) {
          try { NutrientViewer.unload(container); } catch (e) { /* ignore */ }
          return;
        }

        instanceRef.current = instance;
        isDocumentReadyRef.current = false;
        onInstanceLoad?.(instance);

        // Defensive: prevent scroll chaining from viewer to page
        try {
          container.style.overscrollBehavior = "contain";
          const oldScrollBehavior = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = "auto";

          onClickCapture = (ev: MouseEvent) => {
            try {
              const target = ev.target as HTMLElement | null;
              if (!target) return;
              const btn = target.closest("button, [role='button']") as HTMLElement | null;
              const label =
                (btn?.getAttribute("aria-label") || btn?.getAttribute("title") || btn?.dataset?.type || btn?.textContent || "").toLowerCase();

              // defensive: if click looks like thumbnail toggle, restore window scroll Y after SDK action
              if (/thumb|thumbnail|thumbnails|sidebar-thumbnails/.test(label)) {
                const y = window.scrollY;
                requestAnimationFrame(() => window.scrollTo(0, y));
              }
            } catch (err) {
              console.warn("thumbnail capture handler error:", err);
            }
          };

          window.addEventListener("click", onClickCapture, true);

          (instance as any).__nutrient_restore_scroll_behavior = () => {
            document.documentElement.style.scrollBehavior = oldScrollBehavior || "";
          };
        } catch (err) {
          console.warn("Failed to apply defensive viewer styles/listeners:", err);
        }

        // Apply pending mode only when document is ready
        const applyPendingMode = () => {
          if (!instance || !NutrientViewer) return;
          isDocumentReadyRef.current = true;
          while (modeQueueRef.current.length > 0) {
            const queuedMode = modeQueueRef.current.shift();
            if (queuedMode) {
              applyModeToInstance(queuedMode, instance, NutrientViewer);
              console.log("Nutrient: applied queued mode:", queuedMode);
            }
          }
          applyModeToInstance(pendingModeRef.current, instance, NutrientViewer);
          console.log("Nutrient: applied current mode:", pendingModeRef.current);
        };

        if (instance.on) {
          if (typeof instance.isDocumentReady === "function") {
            const interval = setInterval(() => {
              if (instance.isDocumentReady()) {
                clearInterval(interval);
                applyPendingMode();
              }
            }, 50);
          } else {
            instance.on("documentReady", applyPendingMode);
          }
        } else {
          setTimeout(applyPendingMode, 200); // fallback
        }
      } catch (error) {
        console.error("Failed to load Nutrient viewer:", error);
      }
    })();

    return () => {
      disposed = true;
      const container = containerRef.current;
      const lib = libRef.current;
      try {
        if (lib?.unload) {
          lib.unload(container);
        } else if (instanceRef.current?.unload) {
          instanceRef.current.unload(container);
        }
      } catch (error) {
        console.warn("Error during cleanup:", error);
      }

      try {
        if (onClickCapture) {
          window.removeEventListener("click", onClickCapture, true);
          onClickCapture = null;
        }
        const inst = instanceRef.current as any;
        if (inst?.__nutrient_restore_scroll_behavior) {
          try { inst.__nutrient_restore_scroll_behavior(); } catch {}
        }
      } catch (err) {
        console.warn("cleanup defensive handlers error:", err);
      }

      instanceRef.current = null;
      isDocumentReadyRef.current = false;
    };
  }, [documentUrl, onInstanceLoad, isContainerReady]);

  // Apply mode safely whenever it changes (unchanged)
  useEffect(() => {
    pendingModeRef.current = mode;

    const instance = instanceRef.current;
    const NutrientViewer = libRef.current;
    if (!instance || !NutrientViewer) return;

    if (isDocumentReadyRef.current) {
      applyModeToInstance(mode, instance, NutrientViewer);
    } else {
      modeQueueRef.current.push(mode);
      console.log("Nutrient: queued mode change:", mode);
    }
  }, [mode]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100vh", overscrollBehavior: "contain" }}
      className="absolute inset-0 bg-white z-0"
    />
  );
}
