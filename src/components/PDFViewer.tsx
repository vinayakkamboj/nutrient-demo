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

  // Ensure container is mounted and ready (ONLY FIX NEEDED)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        setIsContainerReady(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Helper to apply mode (KEEP YOUR ORIGINAL - IT WORKS)
  const applyModeToInstance = (modeToApply: ViewerMode, instance: any, NutrientViewer: any) => {
    if (!instance || !NutrientViewer) return;

    try {
      switch (modeToApply) {
        case "ANNOTATIONS":
          // Annotations mode: show annotations sidebar, leave interactionMode null
          instance.setViewState((vs: any) =>
            vs.set("sidebarMode", NutrientViewer.SidebarMode.ANNOTATIONS).set("interactionMode", null)
          );

          // keep a limited toolbar suitable for annotations
          const annotationsAllowedTypes = [
            "sidebar-annotations",      // annotations icon
            "pager",                    // pager
            "pan",                      // pan
            "zoom-out",                 // zoom out
            "zoom-in",                  // zoom in
            "spacer",                   // push search/export/print to the right
            "ink",                     // ink annotation
            "text",                // free text
            "note",                // note
            "image",               // image
            "line",                // line
            // Optional variant/toggle items if they exist in your defaults:
            "ink-highlighter",     // toggle ink variants
            "arrow",               // line variant (arrow)
            // Add shape tools/toggles if present in your defaults:
            "rectangle",
            "ellipse",
            "polygon",
            "polyline",
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
          // Enable form design mode (move/resize form fields)
          instance.setViewState((vs: any) =>
            vs.set("formDesignMode", true).set("sidebarMode", null).set("interactionMode", null)
          );

          // keep a limited toolbar suitable for forms
          const formsAllowedTypes = [
            "sidebar-thumbnails",
            "sidebar-document-outline",
            "sidebar-bookmarks",
            "sidebar-annotations",
            "sidebar-signatures",
            "sidebar-layers",
            "pager",            // pager
            "pan",              // pan
            "zoom-out",         // zoom out
            "zoom-in",          // zoom in
            "spacer",           // push form tools/export/print to the right
            "sidebar-forms",    // form tools
            "print",             // print
            "export-pdf"
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
          // Editor mode: enable editing-related toolbar items
          instance.setViewState((vs: any) =>
            vs.set("interactionMode", null).set("sidebarMode", null)
          );

          // keep a limited toolbar suitable for editing (use defaultToolbarItems filtered by allowed types)
          const editorAllowedTypes = [
            "sidebar-annotations", // annotations
            "pager",               // pager
            "pan",                 // pan
            "zoom-out",            // zoom out
            "zoom-in",             // zoom in
            "spacer",              // push editor + export tools to the right
            "document-editor",     
            "print",               
            "export-pdf",          
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
                clone.selected = false; // ensure not pre-selected
              }
              return clone;
            });

          instance.setToolbarItems(editorItems);
          break;


        case "VIEWER":
        default:
          // Default viewer: no special interaction mode; restore a friendly subset of toolbar items
          instance.setViewState((vs: any) =>
            vs.set("interactionMode", null).set("sidebarMode", null)
          );

          // keep a limited toolbar suitable for viewing (use defaultToolbarItems filtered by allowed types)
          const allowedTypes = [
            "pager",
            "pan",
            "zoom-out",            // zoom out
            "zoom-in",
            "zoom-mode",          // zoom mode (fit to width/page)
            "sidebar-document-outline",
            "sidebar-annotations",
            "sidebar-signatures",
            "sidebar-layers",
            "spacer",      // This will push the following items to the right
            "search",
            "export-pdf",
            "print"
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

  // Load / reload viewer (YOUR ORIGINAL WITH MINIMAL FIXES)
  useEffect(() => {
    if (!isContainerReady) return; // ONLY ADDITION: wait for container

    let disposed = false;
    const loadId = Symbol();
    const currentLoadId = loadId;

    (async () => {
      try {
        const imported = await import("@nutrient-sdk/viewer");
        const NutrientViewer: any = imported?.default ?? imported;
        libRef.current = NutrientViewer;

        const container = containerRef.current;
        if (!container) return;

        // SMALL FIX: Add a tiny delay to ensure DOM is fully ready
        await new Promise(resolve => setTimeout(resolve, 50));

        // Unload previous instance safely
        try {
          NutrientViewer.unload(container);
        } catch (error) {
          console.warn("Previous unload error (likely first load):", error);
        }

        console.log("Nutrient: loading document:", documentUrl);

        // SMALL FIX: Handle blob URLs properly
        let documentConfig;
        if (documentUrl.startsWith('blob:')) {
          try {
            const response = await fetch(documentUrl);
            const arrayBuffer = await response.arrayBuffer();
            documentConfig = {
              container,
              document: arrayBuffer,
              baseUrl: `${window.location.protocol}//${window.location.host}/${import.meta.env.PUBLIC_URL ?? ""}`,
            };
          } catch {
            // Fallback to original if blob fetch fails
            documentConfig = {
              container,
              document: documentUrl,
              baseUrl: `${window.location.protocol}//${window.location.host}/${import.meta.env.PUBLIC_URL ?? ""}`,
            };
          }
        } else {
          documentConfig = {
            container,
            document: documentUrl,
            baseUrl: `${window.location.protocol}//${window.location.host}/${import.meta.env.PUBLIC_URL ?? ""}`,
          };
        }

        const instance = await NutrientViewer.load(documentConfig);

        if (disposed || currentLoadId !== loadId) {
          try {
            NutrientViewer.unload(container);
          } catch (e) {
            console.warn("Unload after disposed:", e);
          }
          return;
        }

        instanceRef.current = instance;
        isDocumentReadyRef.current = false;
        onInstanceLoad?.(instance);

        // Apply pending mode only when document is ready (YOUR ORIGINAL - KEEP IT)
        const applyPendingMode = () => {
          if (!instance || !NutrientViewer) return;
          isDocumentReadyRef.current = true;
          // Apply the queued modes
          while (modeQueueRef.current.length > 0) {
            const queuedMode = modeQueueRef.current.shift();
            if (queuedMode) {
              applyModeToInstance(queuedMode, instance, NutrientViewer);
              console.log("Nutrient: applied queued mode:", queuedMode);
            }
          }
          // Apply the current mode
          applyModeToInstance(pendingModeRef.current, instance, NutrientViewer);
          console.log("Nutrient: applied current mode:", pendingModeRef.current);
        };

        // SDK event if available (YOUR ORIGINAL - KEEP IT)
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
      instanceRef.current = null;
      isDocumentReadyRef.current = false;
    };
  }, [documentUrl, onInstanceLoad, isContainerReady]); // ONLY CHANGE: added isContainerReady

  // Apply mode safely whenever it changes (YOUR ORIGINAL - KEEP IT)
  useEffect(() => {
    pendingModeRef.current = mode;

    const instance = instanceRef.current;
    const NutrientViewer = libRef.current;
    if (!instance || !NutrientViewer) return;

    if (isDocumentReadyRef.current) {
      // Only apply if document is ready
      applyModeToInstance(mode, instance, NutrientViewer);
    } else {
      // Queue mode change if document isn't ready
      modeQueueRef.current.push(mode);
      console.log("Nutrient: queued mode change:", mode);
    }
  }, [mode]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100vh" }}
      className="absolute inset-0 bg-white z-0"
    />
  );
}