import type { ToolType } from "./Sidebar";

export type ViewerMode = "VIEWER" | "ANNOTATIONS" | "FORMS" | "EDITOR" | null;
// ----- improved toolbar selector with fallback + retry -----


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
      "rectangle": async () => {
        try {
          const pageIndex = instance.viewState.currentPageIndex;
          const pageInfo = instance.pageInfoForIndex(pageIndex);

          // Define size & centered position
          const width = 200;
          const height = 100;
          const left = (pageInfo.width - width) / 2;
          const top = (pageInfo.height - height) / 2;

          const rectAnnotation = new NutrientViewer.Annotations.RectangleAnnotation({
            pageIndex,
            boundingBox: new NutrientViewer.Geometry.Rect({ left, top, width, height }),
            strokeColor: new NutrientViewer.Color({ r: 0, g: 0, b: 0 }),
            // no fillColor => transparent middle
          });

          // Create and select it
          await instance.create(rectAnnotation);
          instance.setSelectedAnnotations(rectAnnotation.id);

          // Keep rectangle drawing mode active
          instance.setViewState((vs: any) =>
            vs.set("interactionMode", NutrientViewer.InteractionMode.SHAPE_RECTANGLE)
          );
          instance.setToolbarItems((items: any[]) =>
            items.map((item: any) => ({
              ...item,
              selected: item.type === "rectangle" || item.type === "rectangle-annotation"
            })));

          console.log("PDFViewer: Rectangle annotation created (hollow, mode stays active)");
        } catch (err) {
          console.error("Failed to create rectangle annotation:", err);
        }
      },
      "ellipse": async () => {
        try {
          const pageIndex = instance.viewState.currentPageIndex;
          const pageInfo = instance.pageInfoForIndex(pageIndex);

          const width = 150;
          const height = 100;
          const left = (pageInfo.width - width) / 2;
          const top = (pageInfo.height - height) / 2;

          const ellipse = new NutrientViewer.Annotations.EllipseAnnotation({
            pageIndex,
            boundingBox: new NutrientViewer.Geometry.Rect({ left, top, width, height }),
            strokeColor: new NutrientViewer.Color({ r: 0, g: 0, b: 0 }),
            // no fill => hollow ellipse
          });

          await instance.create(ellipse);
          instance.setSelectedAnnotations(ellipse.id);

          instance.setViewState((vs: any) =>
            vs.set("interactionMode", NutrientViewer.InteractionMode.SHAPE_ELLIPSE)
          );
          instance.setToolbarItems((items: any[]) =>
            items.map((item: any) => ({
              ...item,
              selected: item.type === "ellipse" || item.type === "ellipse-annotation"
            })));
        } catch (e) {
          console.error("Ellipse creation failed:", e);
        }
      },
      "line": async () => {
        try {
          const pageIndex = instance.viewState.currentPageIndex;
          const pageInfo = instance.pageInfoForIndex(pageIndex);

          const startX = pageInfo.width / 2 - 100;
          const startY = pageInfo.height / 2;
          const endX = pageInfo.width / 2 + 100;
          const endY = pageInfo.height / 2;

          const boundingBox = new NutrientViewer.Geometry.Rect({
            left: Math.min(startX, endX) - 5,
            top: startY - 5,
            width: Math.abs(endX - startX) + 10,
            height: 10,
          });

          const line = new NutrientViewer.Annotations.LineAnnotation({
            pageIndex,
            startPoint: new NutrientViewer.Geometry.Point({ x: startX, y: startY }),
            endPoint: new NutrientViewer.Geometry.Point({ x: endX, y: endY }),
            boundingBox,
            strokeColor: new NutrientViewer.Color({ r: 0, g: 0, b: 0 }),
            strokeWidth: 2,
          });

          await instance.create(line);
          instance.setSelectedAnnotations(line.id);

          instance.setViewState((vs: any) =>
            vs.set("interactionMode", NutrientViewer.InteractionMode.SHAPE_LINE)
          );
          instance.setToolbarItems((items: any[]) =>
            items.map((item: any) => ({
              ...item,
              selected: item.type === "line" || item.type === "line-annotation",
            }))
          );
        } catch (err) {
          console.error("Line creation failed:", err);
        }
      },

      "arrow": async () => {
        try {
          const pageIndex = instance.viewState.currentPageIndex;
          const pageInfo = instance.pageInfoForIndex(pageIndex);

          const startX = pageInfo.width / 2 - 100;
          const startY = pageInfo.height / 2;
          const endX = pageInfo.width / 2 + 100;
          const endY = pageInfo.height / 2;

          // try SDK Point, fallback to plain object
          let startPoint: any;
          let endPoint: any;
          try {
            startPoint = new NutrientViewer.Geometry.Point({ x: startX, y: startY });
            endPoint = new NutrientViewer.Geometry.Point({ x: endX, y: endY });
          } catch {
            startPoint = { x: startX, y: startY };
            endPoint = { x: endX, y: endY };
          }

          // bounding box (try SDK Rect, fallback to plain object)
          let boundingBox: any;
          try {
            boundingBox = new NutrientViewer.Geometry.Rect({
              left: Math.min(startX, endX) - 5,
              top: startY - 8,
              width: Math.abs(endX - startX) + 10,
              height: 16,
            });
          } catch {
            boundingBox = {
              left: Math.min(startX, endX) - 5,
              top: startY - 8,
              width: Math.abs(endX - startX) + 10,
              height: 16,
            };
          }

          // create arrow annotation (try SDK constructor, fallback to plain params)
          const params: any = {
            pageIndex,
            startPoint,
            endPoint,
            boundingBox,
            strokeWidth: 2,
            strokeColor: (() => { try { return new NutrientViewer.Color({ r: 0, g: 0, b: 0 }); } catch { return undefined; } })(),
            // include both styles to work across SDK variants
            lineEndStyle: "arrow",
            lineCaps: { end: "openArrow" },
          };

          let arrowAnnotation: any;
          try {
            arrowAnnotation = new NutrientViewer.Annotations.LineAnnotation(params);
          } catch {
            // fallback to plain object if constructor not present or errors
            arrowAnnotation = params;
          }

          await instance.create(arrowAnnotation);
          // select by id (same pattern as rectangle)
          if (arrowAnnotation?.id) instance.setSelectedAnnotations(arrowAnnotation.id);

          // activate shape line mode and mark toolbar just like rectangle/ellipse
          instance.setViewState((vs: any) =>
            vs.set("interactionMode", NutrientViewer.InteractionMode.SHAPE_LINE)
          );
          instance.setToolbarItems((items: any[]) =>
            items.map((item: any) => ({
              ...item,
              selected: item.type === "arrow" || item.type === "arrow-annotation"
            }))
          );
        } catch (err) {
          console.error("Arrow creation failed:", err);
        }
      },

      "polygon": async () => {
        try {
          const pageIndex = instance.viewState.currentPageIndex;
          const pageInfo = instance.pageInfoForIndex(pageIndex);

          // Geometry: three-point triangle centered on page
          const coords = [
            { x: pageInfo.width / 2 - 60, y: pageInfo.height / 2 + 50 },
            { x: pageInfo.width / 2, y: pageInfo.height / 2 - 50 },
            { x: pageInfo.width / 2 + 60, y: pageInfo.height / 2 + 50 },
          ];

          const makePoint = (p: { x: number, y: number }) => {
            try { return new NutrientViewer.Geometry.Point(p); } catch { return p; }
          };
          const makeRect = (l: number, t: number, w: number, h: number) => {
            try { return new NutrientViewer.Geometry.Rect({ left: l, top: t, width: w, height: h }); }
            catch { return { left: l, top: t, width: w, height: h }; }
          };
          const makeColor = (r: number, g: number, b: number, a = 1) => {
            try { return new NutrientViewer.Color({ r, g, b, a }); } catch { return undefined; }
          };

          // Use Immutable.List for points if SDK exposes it (more robust across versions)
          let pointsOrVertices: any;
          try {
            if (NutrientViewer && NutrientViewer.Immutable && typeof NutrientViewer.Immutable.List === "function") {
              pointsOrVertices = NutrientViewer.Immutable.List(coords.map(c => makePoint(c)));
            } else {
              pointsOrVertices = coords.map(c => ({ x: c.x, y: c.y }));
            }
          } catch {
            pointsOrVertices = coords.map(c => ({ x: c.x, y: c.y }));
          }

          const boundingBox = makeRect(pageInfo.width / 2 - 60, pageInfo.height / 2 - 50, 120, 100);
          const strokeColor = makeColor(0, 0, 0);

          const params: any = { pageIndex, boundingBox, strokeWidth: 3 };
          if (strokeColor) params.strokeColor = strokeColor;
          // Different SDKs expect either `vertices` or `points`
          if (Array.isArray(pointsOrVertices)) params.vertices = pointsOrVertices;
          else params.points = pointsOrVertices;

          // Create annotation object (try SDK class, else plain params)
          let annotationObj: any;
          try { annotationObj = new NutrientViewer.Annotations.PolygonAnnotation(params); } catch { annotationObj = params; }

          // Create annotation (handle both single-object and array return shapes)
          let created: any;
          try { created = await instance.create(annotationObj); }
          catch (e1) {
            try { created = await instance.create([annotationObj]); }
            catch (e2) { throw e2; }
          }

          const createdItem = Array.isArray(created) ? created[0] : created;
          // robust id extraction (try common shapes)
          const id =
            createdItem?.id ??
            createdItem?.annotation?.id ??
            createdItem?.annotationId ??
            createdItem?.annotation?.annotationId ??
            null;

          // Select the created annotation using Immutable.List if available (best compatibility)
          if (id) {
            try {
              if (NutrientViewer && NutrientViewer.Immutable && typeof NutrientViewer.Immutable.List === "function") {
                await instance.setSelectedAnnotations(NutrientViewer.Immutable.List([id]));
              } else {
                await instance.setSelectedAnnotations([id]);
              }
            } catch (selErr) {
              // best-effort fallback: try plain array again
              try { await instance.setSelectedAnnotations([id]); } catch (e) { /* ignore */ }
            }
          }

          // Force the viewer into polygon creation mode (SDK-native way to toggle toolbar icon).
          try {
            instance.setViewState((vs: any) =>
              vs.set("interactionMode", NutrientViewer.InteractionMode.SHAPE_POLYGON)
            );
          } catch (e) {
            // if setViewState shape constant missing, ignore — selection still attempted below
          }

          // ---- inline, robust toolbar-selection routine (multi-attempt) ----
          const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
          const normalize = (s: any) => (s === undefined || s === null) ? "" : String(s).toLowerCase().trim();

          const localActivateToolbarSelection = async (names: string[], attempts = 6, delay = 80) => {
            const normNames = names.map(n => normalize(n));
            const itemMatches = (item: any) => {
              if (!item) return false;
              const cand = [
                item.type, item.id, item.title, item.name, item.key, (item.props && item.props.type)
              ].map(normalize).filter(Boolean);
              if (!cand.length) return false;
              // allow partial matches (covers variants like 'shape-polygon', 'polygon-annotation', 'polygonBtn')
              return normNames.some(n => cand.some(c => c.includes(n)));
            };

            for (let i = 0; i < attempts; i++) {
              try {
                // primary: try mutating current toolbar items
                instance.setToolbarItems((items: any[] = []) => {
                  const mapped = (items || []).map(it => ({ ...it, selected: itemMatches(it) }));
                  if (mapped.some(m => !!m.selected)) return mapped;

                  // fallback: attempt to set default toolbar items from SDK (if present)
                  try {
                    if (NutrientViewer && Array.isArray(NutrientViewer.defaultToolbarItems)) {
                      const defaults = NutrientViewer.defaultToolbarItems.map((it: any) => ({ ...it, selected: itemMatches(it) }));
                      if (defaults.some((d: any) => !!d.selected)) return defaults;
                    }
                  } catch (err) { /* ignore fallback error */ }

                  // nothing matched; return original items unchanged
                  return items;
                });
              } catch (err) {
                // ignore setToolbarItems errors (some runtimes don't allow direct mutation)
              }

              // quick verification: inspect whichever toolbar list is available
              try {
                const currentToolbar = instance.toolbarItems ?? (NutrientViewer && NutrientViewer.defaultToolbarItems) ?? [];
                if ((currentToolbar || []).some(itemMatches)) return true;
              } catch (err) { /* ignore verification errors */ }

              // wait and retry (covers SDK re-renders that replace toolbar)
              await sleep(delay);
            }

            console.warn("PDFViewer: toolbar selection attempts exhausted for:", names);
            return false;
          };

          // Try a comprehensive set of name variants
          await localActivateToolbarSelection([
            "polygon", "shape-polygon", "polygon-annotation", "polygonTool", "polygon-btn", "shapepolygon"
          ]);

          console.log("PDFViewer: Polygon created, selected and toolbar selection attempted.");
        } catch (err) {
          console.error("Polygon creation failed:", err);
        }
      },


      "polyline": async () => {
        try {
          const pageIndex = instance.viewState.currentPageIndex;
          const pageInfo = instance.pageInfoForIndex(pageIndex);

          const coords = [
            { x: pageInfo.width / 2 - 100, y: pageInfo.height / 2 },
            { x: pageInfo.width / 2, y: pageInfo.height / 2 - 50 },
            { x: pageInfo.width / 2 + 100, y: pageInfo.height / 2 },
          ];

          const makePoint = (p: { x: number, y: number }) => {
            try { return new NutrientViewer.Geometry.Point(p); } catch { return p; }
          };
          const makeRect = (l: number, t: number, w: number, h: number) => {
            try { return new NutrientViewer.Geometry.Rect({ left: l, top: t, width: w, height: h }); }
            catch { return { left: l, top: t, width: w, height: h }; }
          };
          const makeColor = (r: number, g: number, b: number, a = 1) => {
            try { return new NutrientViewer.Color({ r, g, b, a }); } catch { return undefined; }
          };

          let pointsOrVertices: any;
          try {
            if (NutrientViewer && NutrientViewer.Immutable && typeof NutrientViewer.Immutable.List === "function") {
              pointsOrVertices = NutrientViewer.Immutable.List(coords.map(c => makePoint(c)));
            } else {
              pointsOrVertices = coords.map(c => ({ x: c.x, y: c.y }));
            }
          } catch {
            pointsOrVertices = coords.map(c => ({ x: c.x, y: c.y }));
          }

          const boundingBox = makeRect(pageInfo.width / 2 - 100, pageInfo.height / 2 - 50, 200, 50);
          const strokeColor = makeColor(0, 0, 0);

          const params: any = { pageIndex, boundingBox, strokeWidth: 3 };
          if (strokeColor) params.strokeColor = strokeColor;
          if (Array.isArray(pointsOrVertices)) params.vertices = pointsOrVertices;
          else params.points = pointsOrVertices;

          let annotationObj: any;
          try { annotationObj = new NutrientViewer.Annotations.PolylineAnnotation(params); } catch { annotationObj = params; }

          let created: any;
          try { created = await instance.create([annotationObj]); } catch (e) { created = await instance.create(annotationObj); }

          const createdItem = Array.isArray(created) ? created[0] : created;
          const id = createdItem?.id ?? createdItem?.annotation?.id ?? null;

          if (id) {
            try {
              if (NutrientViewer && NutrientViewer.Immutable && typeof NutrientViewer.Immutable.List === "function") {
                await instance.setSelectedAnnotations(NutrientViewer.Immutable.List([id]));
              } else {
                await instance.setSelectedAnnotations([id]);
              }
            } catch (selErr) {
              try { await instance.setSelectedAnnotations([id]); } catch (e) { }
            }
          }

          // Put viewer into polyline drawing mode
          instance.setViewState((vs: any) =>
            vs.set("interactionMode", NutrientViewer.InteractionMode.SHAPE_POLYLINE)
          );

          // local toolbar-selection helper (same logic as polygon)
          const localActivateToolbarSelection = (names: string[]) => {
            const matches = (item: any) =>
              names.some(n => item?.type === n || item?.id === n || (typeof item?.title === "string" && item.title.toLowerCase() === n.toLowerCase()));

            try {
              instance.setToolbarItems((items: any[] = []) => {
                const mapped = (items || []).map((it: any) => ({ ...it, selected: matches(it) }));
                if (mapped.some(m => !!m.selected)) return mapped;

                try {
                  if (NutrientViewer && Array.isArray(NutrientViewer.defaultToolbarItems)) {
                    const defaults = NutrientViewer.defaultToolbarItems.map((it: any) => ({ ...it, selected: matches(it) }));
                    if (defaults.some((d: any) => !!d.selected)) return defaults;
                  }
                } catch (err) { }

                console.warn("PDFViewer: toolbar selection attempted but no matching toolbar item found for:", names);
                return items;
              });

              setTimeout(() => {
                try {
                  instance.setToolbarItems((items: any[] = []) => (items || []).map((it: any) => ({ ...it, selected: matches(it) })));
                } catch (e) { }
              }, 60);
            } catch (err) {
              console.warn("PDFViewer: local toolbar selection failed:", err);
            }
          };

          localActivateToolbarSelection(["polyline", "shape-polyline", "polyline-annotation"]);

          console.log("PDFViewer: Polyline created + toolbar selection attempted");
        } catch (err) {
          console.error("Polyline creation failed:", err);
        }
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