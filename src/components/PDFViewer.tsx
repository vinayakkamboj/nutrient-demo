// PDFViewer.tsx
import { useEffect, useRef } from "react";

export type ViewerMode = "VIEWER" | "ANNOTATIONS" | "FORMS" | "EDITOR";

interface PDFViewerProps {
  mode: ViewerMode;
  documentUrl?: string;
  onInstanceLoad?: (instance: any) => void; // 👈 new prop
}

export function PDFViewer({
  mode,
  documentUrl = "https://www.nutrient.io/downloads/nutrient-web-demo.pdf",
  onInstanceLoad,
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<any>(null);
  const libRef = useRef<any>(null);

  // Load viewer
  useEffect(() => {
    let disposed = false;

    (async () => {
      const imported = await import("@nutrient-sdk/viewer");
      const NutrientViewer: any = imported?.default ?? imported;
      libRef.current = NutrientViewer;

      const container = containerRef.current;
      if (!container) return;

      try {
        if (typeof NutrientViewer.unload === "function") {
          NutrientViewer.unload(container);
        } else if (instanceRef.current?.unload) {
          instanceRef.current.unload(container);
        }
      } catch {}

      const instance = await NutrientViewer.load({
        container,
        document: documentUrl,
        baseUrl: `${window.location.protocol}//${window.location.host}/${
          import.meta.env.PUBLIC_URL ?? ""
        }`,
      });

      if (disposed) {
        try {
          if (typeof NutrientViewer.unload === "function") {
            NutrientViewer.unload(container);
          } else {
            instance?.unload?.(container);
          }
        } catch {}
        return;
      }

      instanceRef.current = instance;
      onInstanceLoad?.(instance); // 👈 give parent the instance
    })().catch((e) => {
      console.error("Failed to load Nutrient viewer:", e);
    });

    return () => {
      disposed = true;
      const container = containerRef.current;
      const lib = libRef.current;
      try {
        if (lib && typeof lib.unload === "function") {
          lib.unload(container);
        } else if (instanceRef.current?.unload) {
          instanceRef.current.unload(container);
        }
      } catch {}
      instanceRef.current = null;
    };
  }, [documentUrl, onInstanceLoad]);

  // React to mode changes
  useEffect(() => {
    const instance = instanceRef.current;
    const NutrientViewer = libRef.current;
    if (!instance || !NutrientViewer) return;

    switch (mode) {
      case "ANNOTATIONS":
        instance.setViewState((vs: any) =>
          vs
            .set("interactionMode", NutrientViewer.InteractionMode.INK)
            .set("sidebarMode", NutrientViewer.SidebarMode.ANNOTATIONS)
        );
        break;
      case "FORMS":
        instance.setViewState((vs: any) =>
          vs
            .set("interactionMode", NutrientViewer.InteractionMode.FORM_CREATOR)
            .set("sidebarMode", null)
        );
        break;
      case "EDITOR":
        instance.setViewState((vs: any) =>
          vs
            .set("interactionMode", NutrientViewer.InteractionMode.CONTENT_EDITOR)
            .set("sidebarMode", null)
        );
        break;
      case "VIEWER":
      default:
        instance.setViewState((vs: any) =>
          vs.set("interactionMode", null).set("sidebarMode", null)
        );
        break;
    }
  }, [mode]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full bg-white z-0"
    />
  );
}
