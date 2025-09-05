// PDFViewer.tsx
import { useEffect, useRef } from "react";

export type ViewerMode = "VIEWER" | "ANNOTATIONS" | "FORMS" | "EDITOR" | null;

interface PDFViewerProps {
  mode?: ViewerMode;
  documentUrl?: string;
  onInstanceLoad?: (instance: any) => void;
}

export function PDFViewer({
  mode = null,
  documentUrl = "https://www.nutrient.io/downloads/nutrient-web-demo.pdf",
  onInstanceLoad,
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<any>(null);
  const libRef = useRef<any>(null);

  // Helper to apply mode to a given instance + lib (NutrientViewer)
  const applyModeToInstance = (modeToApply: ViewerMode, instance: any, NutrientViewer: any) => {
    if (!instance || !NutrientViewer) return;

    try {
      switch (modeToApply) {
        case "ANNOTATIONS":
          // Show annotations sidebar (and leave interactionMode null)
          instance.setViewState((vs: any) =>
            vs.set("sidebarMode", NutrientViewer.SidebarMode.ANNOTATIONS).set("interactionMode", null)
          );
          break;

        case "FORMS":
          // Enter form-creator interaction mode
          instance.setViewState((vs: any) =>
            vs.set("interactionMode", NutrientViewer.InteractionMode.FORM_CREATOR).set("sidebarMode", null)
          );
          break;

        case "EDITOR":
          // Enter document editor mode
          instance.setViewState((vs: any) =>
            vs.set("interactionMode", NutrientViewer.InteractionMode.DOCUMENT_EDITOR).set("sidebarMode", null)
          );
          break;

        case "VIEWER":
        default:
          // Default viewing UI
          instance.setViewState((vs: any) => vs.set("interactionMode", null).set("sidebarMode", null));
          break;
      }

      // small debug
      // console.log("Applied mode", modeToApply);
    } catch (err) {
      console.error("applyModeToInstance error:", err);
    }
  };

  // Load / reload viewer when documentUrl changes (or on mount)
  useEffect(() => {
    let disposed = false;

    (async () => {
      try {
        const imported = await import("@nutrient-sdk/viewer");
        const NutrientViewer: any = imported?.default ?? imported;
        libRef.current = NutrientViewer;

        const container = containerRef.current;
        if (!container) return;

        // unload previous instance
        try {
          NutrientViewer.unload(container);
        } catch (error) {
          // ignore first-load unload failures
          console.warn("Previous unload error (likely first load):", error);
        }

        console.log("Nutrient: loading document:", documentUrl);

        // load instance
        const instance = await NutrientViewer.load({
          container,
          document: documentUrl,
          baseUrl: `${window.location.protocol}//${window.location.host}/${import.meta.env.PUBLIC_URL ?? ""}`,
          // optionally add initial options here (toolbar config, presets, licenseKey, etc.)
        });

        if (disposed) {
          try {
            NutrientViewer.unload(container);
          } catch (e) {
            console.warn("Unload after disposed:", e);
          }
          return;
        }

        instanceRef.current = instance;
        onInstanceLoad?.(instance);

        // HERE'S THE FIX: Apply the current mode *after* the new instance is available
        if (mode) {
          applyModeToInstance(mode, instance, NutrientViewer);
        } else {
          // default viewer state
          applyModeToInstance("VIEWER", instance, NutrientViewer);
        }

        console.log("Nutrient: loaded and applied mode:", mode ?? "VIEWER");
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
      instanceRef.current = null;
    };
    // Re-run when documentUrl changes (and when initial mount)
  }, [documentUrl, onInstanceLoad, mode]);

  // When mode changes (and instance already exists), apply it
  useEffect(() => {
    const instance = instanceRef.current;
    const NutrientViewer = libRef.current;
    if (!instance || !NutrientViewer) {
      // instance not ready — the load-effect will apply the mode after load
      return;
    }

    applyModeToInstance(mode, instance, NutrientViewer);
  }, [mode]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full bg-white z-0"
    />
  );
}
