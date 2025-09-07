import type { ToolType } from "./Sidebar";

export type ViewerMode = "VIEWER" | "ANNOTATIONS" | "FORMS" | "EDITOR" | null;

// Tool activation mapping and logic
export const activateTool = (toolType: ToolType, toolName: string, instance: any, NutrientViewer: any) => {
  if (!instance || !NutrientViewer) return;

  try {
    console.log("PDFViewer: activating tool ->", toolType, toolName);

    // Tool activation mapping based on Nutrient Web SDK interaction modes
    const toolActivationMap: Record<ToolType, () => void> = {
      // VIEWER MODE TOOLS
      "office-documents": async () => {
        try {
          instance.setToolbarItems((items: any[]) => [
            ...items,
            {
              type: "custom",
              id: "office-document",
              title: "Office document",
              onPress: async () => {
                await instance.load?.({
                  document: "https://example.com/sample.docx"
                });
              }
            }
          ]);
          console.log("PDFViewer: Office document action added to toolbar");
        } catch (e) {
          console.error("Failed to enable office document action:", e);
        }
      },

      "magazine-view": () => {
        try {
          instance.setToolbarItems((items: any[]) => [
            ...items,
            {
              type: "custom",
              id: "magazine-view",
              title: "Magazine",
              onPress: () => {
                instance.setViewState(
                  () =>
                    new NutrientViewer.ViewState({
                      scrollMode: NutrientViewer.ScrollMode.PER_SPREAD,
                      layoutMode: NutrientViewer.LayoutMode.DOUBLE,
                      keepFirstSpreadAsSinglePage: true,
                    })
                );
              }
            }
          ]);
          console.log("PDFViewer: Magazine view action added to toolbar");
        } catch (e) {
          console.error("Failed to enable magazine view:", e);
        }
      },


      "search": () => {
        // Enter built-in Search mode (focuses the search input)
        instance.setViewState((vs: any) =>
          vs
            .set("interactionMode", NutrientViewer.InteractionMode.SEARCH)
            // Optionally show a sidebar (or set to null if you don’t want one)
            .set("sidebarMode", null)
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

      "line": () => {
        instance.setViewState((vs: any) =>
          vs.set("interactionMode", NutrientViewer.InteractionMode.SHAPE_LINE)
        );
        instance.setToolbarItems((items: any[]) =>
          items.map((item: any) => ({
            ...item,
            selected: item.type === "line"
          }))
        );
      },

      "arrow": () => {
        instance.setCurrentAnnotationPreset("arrow"); // ensure the variant’s preset is active
        instance.setViewState((vs: any) =>
          vs.set("interactionMode", NutrientViewer.InteractionMode.SHAPE_LINE)
        );
        instance.setToolbarItems((items: any[]) =>
          items.map((i: any) => ({ ...i, selected: i.type === "arrow" }))
        );
      },

      "ellipse": () => {
        instance.setViewState((vs: any) =>
          vs.set("interactionMode", NutrientViewer.InteractionMode.SHAPE_ELLIPSE)
        );
        instance.setToolbarItems((items: any[]) =>
          items.map((item: any) => ({
            ...item,
            selected: item.type === "ellipse" || item.type === "shape-ellipse"
          }))
        );
      },

      "polygon": () => {
        instance.setViewState((vs: any) =>
          vs.set("interactionMode", NutrientViewer.InteractionMode.SHAPE_POLYGON)
        );
        instance.setToolbarItems((items: any[]) =>
          items.map((item: any) => ({
            ...item,
            selected: item.type === "polygon" || item.type === "shape-polygon"
          }))
        );
      },

      "polyline": () => {
        instance.setViewState((vs: any) =>
          vs.set("interactionMode", NutrientViewer.InteractionMode.SHAPE_POLYLINE)
        );
        instance.setToolbarItems((items: any[]) =>
          items.map((item: any) => ({
            ...item,
            selected: item.type === "polyline" || item.type === "shape-polyline"
          }))
        );
      },


      // FORM MODE TOOLS
      "form-text": () => {
        // Ensure Form Creator is in the toolbar
        instance.setToolbarItems((items: any[]) => [
          ...items,
          { type: "form-creator" }
        ]);

        // Switch to form creator mode (Text Widget available in secondary toolbar)
        instance.setViewState((vs: any) =>
          vs.set("interactionMode", NutrientViewer.InteractionMode.FORM_CREATOR)
            .set("formDesignMode", true)
        );

        console.log("PDFViewer: Activated Form Text Field");
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
          vs
            .set("sidebarMode", NutrientViewer.SidebarMode.THUMBNAILS)
            .set("interactionMode", NutrientViewer.InteractionMode.DOCUMENT_EDITOR)
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
        // Enter Crop Mode
        instance.setViewState((vs: any) =>
          vs.set("interactionMode", NutrientViewer.InteractionMode.DOCUMENT_CROP)
        );

        // Optional: mark your toolbar item as selected (purely visual)
        instance.setToolbarItems((items: any[]) =>
          items.map((item: any) => ({ ...item, selected: item.type === "document-crop" }))
        );
      },

      "content-editor": () => {
        // Enter Content Editor mode
        instance.setViewState((vs: any) =>
          vs
            .set("sidebarMode", NutrientViewer.SidebarMode.CONTENT_EDITOR)
            .set("interactionMode", NutrientViewer.InteractionMode.CONTENT_EDITOR)
        );

        // Optionally reflect selection state in your toolbar (visual only)
        instance.setToolbarItems((items: any[]) =>
          items.map((item) => ({
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

// Mode application logic
export const applyModeToInstance = (modeToApply: ViewerMode, instance: any, NutrientViewer: any) => {
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
          vs.set("interactionMode", null).set("sidebarMode", null)
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
export const waitForContainerReadyDom = (container: HTMLElement | null, timeoutMs = 2000) => {
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

// Defensive click handler for thumbnail scroll prevention
export const createDefensiveClickHandler = () => {
  return (ev: MouseEvent) => {
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
};