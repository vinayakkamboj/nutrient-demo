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

  const applyModeToInstance = (modeToApply: ViewerMode, instance: any, NutrientViewer: any) => {
    if (!instance || !NutrientViewer || !modeToApply) return; // only apply if mode is explicitly set

    try {
  switch (modeToApply) {
    case "ANNOTATIONS":
      instance.setViewState((vs: any) =>
        vs
          .set("interactionMode", null)
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
      // Requires content editor license in Standalone mode.
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
} catch (err) {
  console.error("applyModeToInstance error:", err);
}
  };

  // Load / reload viewer
  useEffect(() => {
    let disposed = false;

    (async () => {
      try {
        const imported = await import("@nutrient-sdk/viewer");
        const NutrientViewer: any = imported?.default ?? imported;
        libRef.current = NutrientViewer;

        const container = containerRef.current;
        if (!container) return;

        // unload previous instance if any
        try {
          NutrientViewer.unload(container);
        } catch (err) {
          console.warn("Previous unload error (likely first load):", err);
        }

        console.log("Nutrient: loading document:", documentUrl);

        // load instance
        const instance = await NutrientViewer.load({
          container,
          document: documentUrl,
          baseUrl: `${window.location.protocol}//${window.location.host}/${import.meta.env.PUBLIC_URL ?? ""}`,
        });

        if (disposed) {
          try {
            NutrientViewer.unload(container);
          } catch (err) {
            console.warn("Unload after disposed:", err);
          }
          return;
        }

        instanceRef.current = instance;
        onInstanceLoad?.(instance);

        // ONLY apply mode if user explicitly selected one
        if (mode) {
          applyModeToInstance(mode, instance, NutrientViewer);
          console.log("Applied user-selected mode:", mode);
        } else {
          console.log("Default Nutrient viewer loaded (no mode applied)");
          // nothing here, SDK shows default viewer UI
        }
      } catch (err) {
        console.error("Failed to load Nutrient viewer:", err);
      }
    })();

    return () => {
      disposed = true;
      const container = containerRef.current;
      const lib = libRef.current;
      try {
        if (lib?.unload) lib.unload(container);
        else if (instanceRef.current?.unload) instanceRef.current.unload(container);
      } catch (err) {
        console.warn("Error during cleanup:", err);
      }
      instanceRef.current = null;
    };
  }, [documentUrl, onInstanceLoad]); // removed mode dependency here

  // Apply mode dynamically if user changes mode
  useEffect(() => {
    const instance = instanceRef.current;
    const NutrientViewer = libRef.current;
    if (!instance || !NutrientViewer || !mode) return;

    applyModeToInstance(mode, instance, NutrientViewer);
  }, [mode]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full bg-white z-0"
    />
  );
}
