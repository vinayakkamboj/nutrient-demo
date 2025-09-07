import { useEffect, useRef, useState } from "react";
import type { ToolType } from "./Sidebar";
import type { ViewerMode } from "./PDFViewerUtils";
import { 
  activateTool, 
  applyModeToInstance, 
  waitForContainerReadyDom,
  createDefensiveClickHandler
} from "./PDFViewerUtils";

interface PDFViewerProps {
  mode?: ViewerMode;
  documentUrl?: string;
  onInstanceLoad?: (instance: any) => void;
  onToolActivation?: (toolType: ToolType, toolName: string) => void;
}
// Export ViewerMode type so it can be imported elsewhere

export function PDFViewer({
  mode = null,
  documentUrl = "/document.pdf",
  onInstanceLoad,
  onToolActivation,
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<any>(null);
  const libRef = useRef<any>(null);
  const pendingModeRef = useRef<ViewerMode>(mode);
  const isDocumentReadyRef = useRef(false);
  const modeQueueRef = useRef<ViewerMode[]>([]);
  const toolActivationQueueRef = useRef<Array<{toolType: ToolType, toolName: string}>>([]);
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

          onClickCapture = createDefensiveClickHandler();
          window.addEventListener("click", onClickCapture, true);

          (instance as any).__nutrient_restore_scroll_behavior = () => {
            document.documentElement.style.scrollBehavior = oldScrollBehavior || "";
          };
        } catch (err) {
          console.warn("Failed to apply defensive viewer styles/listeners:", err);
        }

        // Apply pending mode and tools only when document is ready
        const applyPendingModeAndTools = () => {
          if (!instance || !NutrientViewer) return;
          isDocumentReadyRef.current = true;
          
          // Apply queued mode changes
          while (modeQueueRef.current.length > 0) {
            const queuedMode = modeQueueRef.current.shift();
            if (queuedMode) {
              applyModeToInstance(queuedMode, instance, NutrientViewer);
              console.log("Nutrient: applied queued mode:", queuedMode);
            }
          }
          
          // Apply current mode
          applyModeToInstance(pendingModeRef.current, instance, NutrientViewer);
          console.log("Nutrient: applied current mode:", pendingModeRef.current);

          // Apply queued tool activations
          while (toolActivationQueueRef.current.length > 0) {
            const queuedTool = toolActivationQueueRef.current.shift();
            if (queuedTool) {
              activateTool(queuedTool.toolType, queuedTool.toolName, instance, NutrientViewer);
              console.log("Nutrient: applied queued tool activation:", queuedTool);
            }
          }
        };

        if (instance.on) {
          if (typeof instance.isDocumentReady === "function") {
            const interval = setInterval(() => {
              if (instance.isDocumentReady()) {
                clearInterval(interval);
                applyPendingModeAndTools();
              }
            }, 50);
          } else {
            instance.on("documentReady", applyPendingModeAndTools);
          }
        } else {
          setTimeout(applyPendingModeAndTools, 200); // fallback
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

  // Apply mode safely whenever it changes
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

  // Handle tool activation from sidebar
  useEffect(() => {
    const handleToolActivation = (toolType: ToolType, toolName: string) => {
      const instance = instanceRef.current;
      const NutrientViewer = libRef.current;
      
      if (!instance || !NutrientViewer) {
        // Queue tool activation if viewer isn't ready yet
        toolActivationQueueRef.current.push({ toolType, toolName });
        console.log("PDFViewer: queued tool activation:", toolType, toolName);
        return;
      }

      if (isDocumentReadyRef.current) {
        activateTool(toolType, toolName, instance, NutrientViewer);
      } else {
        // Queue tool activation if document isn't ready yet
        toolActivationQueueRef.current.push({ toolType, toolName });
        console.log("PDFViewer: queued tool activation (doc not ready):", toolType, toolName);
      }
    };

    if (onToolActivation) {
      // Set up tool activation handler
      (globalThis as any).__pdfViewerToolActivation = handleToolActivation;
    }

    return () => {
      // Cleanup
      delete (globalThis as any).__pdfViewerToolActivation;
    };
  }, [onToolActivation]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100vh", overscrollBehavior: "contain" }}
      className="absolute inset-0 bg-white z-0"
    />
  );
}