import { useEffect, useRef, useState } from "react";
import type { ToolType } from "./Sidebar";

export type ViewerMode = "VIEWER" | "ANNOTATIONS" | "FORMS" | "EDITOR" | null;

interface PDFViewerProps {
  mode?: ViewerMode;
  documentUrl?: string;
  onInstanceLoad?: (instance: any) => void;
  onToolActivation?: (toolType: ToolType, toolName: string) => void;
}

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

  // Helper to activate specific tools based on toolType
  const activateTool = (toolType: ToolType, toolName: string, instance: any, NutrientViewer: any) => {
    if (!instance || !NutrientViewer) return;

    try {
      console.log("PDFViewer: activating tool ->", toolType, toolName);

      // Tool activation mapping based on Nutrient Web SDK interaction modes
      const toolActivationMap: Record<ToolType, () => void> = {
        // VIEWER MODE TOOLS
        "office-documents": () => {
          // Handle office document viewing - no specific interaction mode needed
          console.log("Office documents viewing enabled");
        },
        "magazine-view": () => {
          // Set spread mode for magazine-style viewing
          instance.setViewState((vs: any) => 
            vs.set("spreadMode", NutrientViewer.SpreadMode.DOUBLE_PAGE)
          );
        },
        "search": () => {
          // Activate search functionality
          instance.setViewState((vs: any) => 
            vs.set("sidebarMode", NutrientViewer.SidebarMode.DOCUMENT_OUTLINE)
              .set("interactionMode", null)
          );
        },
        "upload": () => {
          // Upload is handled by sidebar, no viewer action needed
          console.log("Upload triggered from toolbar");
        },

        // ANNOTATION MODE TOOLS
        "image": () => {
          // Activate image annotation mode
          instance.setViewState((vs: any) => 
            vs.set("interactionMode", NutrientViewer.InteractionMode.IMAGE)
          );
          // Also ensure the image toolbar item is selected
          instance.setToolbarItems((items: any[]) => 
            items.map((item: any) => ({
              ...item,
              selected: item.type === "image" || item.type === "image-annotation"
            }))
          );
        },
        "stamp": () => {
          // Activate stamp annotation mode
          instance.setViewState((vs: any) => 
            vs.set("interactionMode", NutrientViewer.InteractionMode.STAMP_PICKER)
          );
          // Select stamp toolbar item
          instance.setToolbarItems((items: any[]) => 
            items.map((item: any) => ({
              ...item,
              selected: item.type === "stamp" || item.type === "stamp-picker"
            }))
          );
        },
        "rectangle": () => {
          // Activate rectangle annotation mode
          instance.setViewState((vs: any) => 
            vs.set("interactionMode", NutrientViewer.InteractionMode.SHAPE_RECTANGLE)
          );
          // Select rectangle toolbar item
          instance.setToolbarItems((items: any[]) => 
            items.map((item: any) => ({
              ...item,
              selected: item.type === "rectangle" || item.type === "shape-rectangle"
            }))
          );
        },
        "ink-highlighter": () => {
          // Activate highlighter annotation mode
          instance.setViewState((vs: any) => 
            vs.set("interactionMode", NutrientViewer.InteractionMode.INK)
          );
          // Select ink highlighter toolbar item
          instance.setToolbarItems((items: any[]) => 
            items.map((item: any) => ({
              ...item,
              selected: item.type === "ink-highlighter" || item.type === "highlighter"
            }))
          );
        },

        // FORM MODE TOOLS
        "form-text": () => {
          // Activate text form field creation
          instance.setViewState((vs: any) => 
            vs.set("interactionMode", NutrientViewer.InteractionMode.FORM_TEXT)
              .set("formDesignMode", true)
          );
          // Select form text toolbar item
          instance.setToolbarItems((items: any[]) => 
            items.map((item: any) => ({
              ...item,
              selected: item.type === "form-text" || item.type === "text-form-field"
            }))
          );
        },
        "form-signature": () => {
          // Activate signature form field creation
          instance.setViewState((vs: any) => 
            vs.set("interactionMode", NutrientViewer.InteractionMode.SIGNATURE)
              .set("formDesignMode", true)
          );
          // Select signature toolbar item
          instance.setToolbarItems((items: any[]) => 
            items.map((item: any) => ({
              ...item,
              selected: item.type === "signature" || item.type === "form-signature"
            }))
          );
        },
        "forms": () => {
          // Toggle forms sidebar and enable form design mode
          instance.setViewState((vs: any) => 
            vs.set("sidebarMode", NutrientViewer.SidebarMode.FORMS)
              .set("formDesignMode", true)
              .set("interactionMode", null)
          );
        },

        // EDITOR MODE TOOLS
        "page-manipulation": () => {
  // Open thumbnails sidebar for page management
  instance.setViewState((vs: any) =>
    vs.set("sidebarMode", NutrientViewer.SidebarMode.THUMBNAILS)
      .set("interactionMode", null)
  );

  // Ensure page manipulation features are enabled if SDK supports it
  try {
    if (instance.setPageManipulationMode) {
      instance.setPageManipulationMode(true);
    }
  } catch (e) {
    console.warn("Page manipulation mode not available:", e);
  }

  // Select the correct toolbar item
  instance.setToolbarItems((items: any[]) =>
    items.map((item: any) => ({
      ...item,
      selected: item.type === "document-editor",
    }))
  );
},

"crop-pages": () => {
  // Reset interaction mode (don’t rely on InteractionMode.CROP)
  instance.setViewState((vs: any) =>
    vs.set("interactionMode", null)
  );

  // Select the proper Nutrient crop toolbar item
  instance.setToolbarItems((items: any[]) =>
    items.map((item: any) => ({
      ...item,
      selected: item.type === "document-crop",
    }))
  );
},

"content-editor": () => {
  // Reset interaction mode (don’t force DOCUMENT_EDITOR)
  instance.setViewState((vs: any) =>
    vs.set("interactionMode", null)
  );

  // Select the proper content editor toolbar item
  instance.setToolbarItems((items: any[]) =>
    items.map((item: any) => ({
      ...item,
      selected: item.type === "content-editor",
    }))
  );
},

        "edit-text": () => {
          // Activate text editing mode
          instance.setViewState((vs: any) => 
            vs.set("interactionMode", NutrientViewer.InteractionMode.TEXT)
          );
          // Select text editing toolbar item
          instance.setToolbarItems((items: any[]) => 
            items.map((item: any) => ({
              ...item,
              selected: item.type === "text" || item.type === "edit-text"
            }))
          );
        },
      };

      // Execute the tool activation
      const activationFn = toolActivationMap[toolType];
      if (activationFn) {
        activationFn();
        console.log(`PDFViewer: ${toolName} (${toolType}) activated successfully`);
      } else {
        console.warn(`PDFViewer: No activation handler found for tool type: ${toolType}`);
      }

    } catch (err) {
      console.error("PDFViewer: Tool activation error:", err);
    }
  };

  // Helper to apply mode (enhanced with tool activation support)
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
            "rectangle", "ellipse", "polygon", "polyline", "stamp", "stamp-picker",
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
            "spacer", "sidebar-forms", "print", "export-pdf", "form-text", "form-signature",
            "text-form-field", "signature"
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

  // Explicitly allow only the editor-related tools we want
  const editorAllowedTypes = [
    "sidebar-annotations",
    "pager",
    "pan",
    "zoom-out",
    "zoom-in",
    "spacer",
    "content-editor",   // ✅ Content Editor
    "document-editor",  // ✅ Page Manipulation / Document Editor
    "document-crop",    // ✅ Crop Tool
    "print",
    "export-pdf",
  ];

  const editorItems = editorAllowedTypes
    .map((type) =>
      NutrientViewer.defaultToolbarItems.find((item: any) => item.type === type) ||
      (type === "spacer" ? { type: "spacer" } : null)
    )
    .filter(Boolean)
    .map((item: any) => {
      const clone = { ...item };
      // make sure none are auto-selected on load
      if (
        clone.type === "document-editor" ||
        clone.type === "content-editor" ||
        clone.type === "document-crop"
      ) {
        clone.selected = false;
      }
      return clone;
    });

  instance.setToolbarItems(editorItems);
  break;


        case "VIEWER":
        default:
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