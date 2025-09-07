// Sidebar.tsx - Fixed version with consistent dark theme
import { useRef, useState, useEffect } from "react";
import {
  ListChecks,
  Edit,
  Edit3,
  Upload,
  ChevronDown,
  Eye,
  Highlighter,
  FileCheck,
  LayoutDashboard,
  X,
  Image,
  Stamp,
  Shapes,
  Type,
  PenTool,
  Crop,
  FileText,
} from "lucide-react";
import type { ViewerMode } from "./PDFViewer";

// Export tool types for PDFViewer integration
export type ToolType =
  | "office-documents"
  | "magazine-view"
  | "search"
  | "upload"
  | "image"
  | "stamp"
  | "rectangle"
  | "ink-highlighter"
  | "form-text"
  | "form-signature"
  | "forms"
  | "page-manipulation"
  | "crop-pages"
  | "content-editor"
  | "edit-text";

export type ToolAction = "toggle" | "activate" | "upload";

export interface ToolConfig {
  name: string;
  icon: any;
  description: string;
  toolType: ToolType;
  action: ToolAction;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onSelectMode: (mode: ViewerMode) => void;
  activeMode: ViewerMode;
  onFileUpload: (url: string) => void;
  onToolAction?: (toolType: ToolType, toolName: string) => void;
}

interface FeatureItem {
  name: string;
  icon: any;
  mode: ViewerMode;
  description: string;
  tools: ToolConfig[];
  detailIcon: any;
}

const items: FeatureItem[] = [
  {
    name: "Viewer",
    icon: Eye,
    mode: "VIEWER",
    description: "Fast, accurate, and reliable document rendering in your browser. View PDFs, image files, and MS Office documents within a flexible and fully customizable UI.",
    tools: [
      { name: "Upload File", icon: Upload, description: "Upload new document", toolType: "upload", action: "upload" },
      { name: "Office Documents", icon: FileText, description: "View Office files", toolType: "office-documents", action: "toggle" },
      { name: "Search Text", icon: Eye, description: "Find content", toolType: "search", action: "toggle" },
    ],
    detailIcon: Eye,
  },
  {
    name: "Annotations",
    icon: Highlighter,
    mode: "ANNOTATIONS",
    description: "A plug-and-play PDF annotation library with more than 15 tools that lets you highlight, draw, and add shapes, texts, notes, comments, and more.",
    tools: [
      { name: "Upload File", icon: Upload, description: "Upload new document", toolType: "upload", action: "upload" },
      { name: "Add Image", icon: Image, description: "Insert images into document", toolType: "image", action: "activate" },
      { name: "Add Stamp", icon: Stamp, description: "Add custom stamps", toolType: "stamp", action: "activate" },
      { name: "Add Shapes", icon: Shapes, description: "Draw geometric shapes", toolType: "rectangle", action: "activate" },
      { name: "Highlight Text", icon: Highlighter, description: "Highlight content", toolType: "ink-highlighter", action: "activate" },
    ],
    detailIcon: Highlighter,
  },
  {
    name: "Forms",
    icon: ListChecks,
    mode: "FORMS",
    description: "Easily create, view, and fill PDF forms. Capture data on your server, or flatten it into a PDF. Supports checkboxes, combo boxes, list boxes, and more.",
    tools: [
      { name: "Upload File", icon: Upload, description: "Upload new document", toolType: "upload", action: "upload" },
      { name: "Text Field", icon: Type, description: "Add text input fields", toolType: "form-text", action: "activate" },
      { name: "Signature Field", icon: PenTool, description: "Add signature areas", toolType: "form-signature", action: "activate" },
    ],
    detailIcon: FileCheck,
  },
  {
    name: "Editor",
    icon: Edit,
    mode: "EDITOR",
    description: "Quickly deploy PDF editing features in your application. Edit PDF text and manipulate pages directly in the browser: add, merge, rotate, reorder, and delete document pages.",
    tools: [
      { name: "Upload File", icon: Upload, description: "Upload new document", toolType: "upload", action: "upload" },
      { name: "Page Manipulation", icon: LayoutDashboard, description: "Reorder and manage pages", toolType: "page-manipulation", action: "activate" },
      { name: "Crop Tool", icon: Crop, description: "Crop page content", toolType: "crop-pages", action: "activate" },
      { name: "Content Editor", icon: Edit3, description: "Edit text and content", toolType: "content-editor", action: "activate" },
      { name: "Text Editing", icon: Type, description: "Modify document text", toolType: "edit-text", action: "activate" },
    ],
    detailIcon: Edit3,
  },
];

export function Sidebar({
  collapsed,
  onToggle,
  onSelectMode,
  activeMode,
  onFileUpload,
  onToolAction,
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [expandedDropdown, setExpandedDropdown] = useState<ViewerMode | null>(null);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-collapse on mobile when mode changes
  useEffect(() => {
    if (isMobile && !collapsed) {
      // Small delay to show selection, then auto-collapse
      const timer = setTimeout(() => {
        onToggle();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeMode, isMobile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      console.log("Sidebar: file chosen ->", file.name);
      setUploadedFileName(file.name);
      onFileUpload(url);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const url = URL.createObjectURL(file);
      console.log("Sidebar: dropped file ->", file.name);
      setUploadedFileName(file.name);
      onFileUpload(url);
    }
  };

  const toggleDropdown = (mode: ViewerMode) => {
    if (collapsed) return;
    setExpandedDropdown((prev) => (prev === mode ? null : mode));
    setExpandedTool(null); // Close any expanded tool when switching modes
  };

  const toggleTool = (toolId: string) => {
    if (collapsed) return;
    setExpandedTool((prev) => (prev === toolId ? null : toolId));
  };

  const handleToolClick = (tool: ToolConfig) => {
    if (tool.action === "upload") {
      fileInputRef.current?.click();
    } else {
      onToolAction?.(tool.toolType, tool.name);
    }
  };

  // Mobile overlay when expanded
  const mobileOverlay = isMobile && !collapsed;

  return (
    <>
      {/* Mobile backdrop overlay */}
      {mobileOverlay && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={
          "relative flex h-full flex-col transition-all duration-300 z-50 " +
          "bg-neutral-900 text-neutral-100 border-r border-neutral-800 " +
          (collapsed
            ? "w-12 md:w-16"
            : isMobile
              ? "w-80 fixed left-0 top-0 bottom-0 shadow-2xl"
              : "w-80"
          )
        }
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Mobile close button */}
        {!collapsed && isMobile && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onToggle}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-neutral-300" />
            </button>
          </div>
        )}

        {/* Collapse/Expand pill - responsive design */}
        <div
          onClick={onToggle}
          className={
            isMobile
              ? "absolute top-1/2 -right-3 -translate-y-1/2 cursor-pointer z-45 " +
              "flex items-center justify-center h-10 w-3 " +
              "bg-neutral-800 hover:bg-neutral-700 " +
              "rounded-r-md transition-all duration-200 border border-neutral-700 " +
              "group shadow-lg"
              : "absolute top-1/2 -right-4 -translate-y-1/2 cursor-pointer z-45 " +
              "flex items-center justify-center h-14 w-4 " +
              "bg-neutral-800 hover:bg-neutral-700 " +
              "rounded-r-md transition-all duration-200 border border-neutral-700 " +
              "group shadow-lg"
          }
        >
          <div className="flex flex-col items-center space-y-1">
            <div className={`${isMobile ? 'w-2 h-0.5' : 'w-2.5 h-0.5'} bg-neutral-400 group-hover:bg-neutral-300 transition-colors rounded-full`} />
            <div className={`${isMobile ? 'w-2 h-0.5' : 'w-2.5 h-0.5'} bg-neutral-400 group-hover:bg-neutral-300 transition-colors rounded-full`} />
            <div className={`${isMobile ? 'w-2 h-0.5' : 'w-2.5 h-0.5'} bg-neutral-400 group-hover:bg-neutral-300 transition-colors rounded-full`} />
          </div>
        </div>

        {/* Header */}
        <div className={`px-3 md:px-4 ${isMobile ? 'py-4 pt-6' : 'py-6'} border-b border-neutral-800 flex items-center justify-center`}>
          {collapsed ? (
            <div className="flex items-center justify-center">
              <div className="w-6 md:w-8 h-6 md:h-8 rounded-lg bg-transparent flex items-center justify-center shadow-none">
                <LayoutDashboard className="h-3 md:h-4 w-3 md:w-4 text-neutral-400" />
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 w-full">
              <div className="w-6 md:w-8 h-6 md:h-8 rounded-lg bg-transparent flex items-center justify-center shadow-none">
                <LayoutDashboard className="h-3 md:h-4 w-3 md:w-4 text-neutral-400" />
              </div>
              <div>
                <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-white`}>Tools</h2>
                <p className="text-xs text-neutral-400">Select the feature</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation items */}
        <nav className={`flex-1 px-2 md:px-3 ${isMobile ? 'py-3' : 'py-4'} space-y-2 overflow-y-auto`}>
          {items.map((item) => {
            const isActive = activeMode === item.mode;
            const isExpanded = expandedDropdown === item.mode;
            const Icon = item.icon;

            return (
              <div key={item.name} className="relative">
                {/* Main Tab Button */}
                <button
                  title={collapsed ? item.name : undefined}
                  onClick={() => {
                    onSelectMode(item.mode);
                    if (!collapsed) toggleDropdown(item.mode);
                  }}
                  className={
                    "group relative w-full flex items-center rounded-lg px-2 md:px-3 py-2 md:py-3 text-xs md:text-[13px] font-medium font-['Inter'] transition-all duration-200 " +
                    (isActive
                      ? "bg-neutral-800 text-white shadow-lg border border-neutral-700"
                      : "text-neutral-400 hover:bg-neutral-800 hover:text-white") +
                    (collapsed ? " justify-center" : " justify-between")
                  }
                >
                  <div className="flex items-center">
                    <Icon
                      className={`h-4 md:h-[18px] w-4 md:w-[18px] flex-shrink-0 transition-colors ${isActive
                          ? "text-neutral-300"
                          : "text-neutral-400 group-hover:text-neutral-300"
                        }`}
                    />
                    {!collapsed && <span className="ml-2 md:ml-3 tracking-tight">{item.name}</span>}
                  </div>

                  {!collapsed && (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(item.mode);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") toggleDropdown(item.mode);
                      }}
                      className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-neutral-700 rounded cursor-pointer select-none"
                    >
                      <ChevronDown
                        className={`h-3 w-3 text-neutral-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                          }`}
                      />
                    </div>
                  )}

                  <span
                    className={`pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-gradient-to-b from-neutral-300 to-neutral-400 transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-0"
                      }`}
                  />
                </button>

                {/* Tools Dropdown */}
                {isExpanded && !collapsed && (
                  <div className="mt-2 mx-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-neutral-800 rounded-lg border border-neutral-700 shadow-xl overflow-hidden">
                      <div className="p-4 border-b border-neutral-700">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center flex-shrink-0">
                            <item.detailIcon className="w-4 h-4 text-neutral-300" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-white mb-1">{item.name} Mode</h4>
                            <p className="text-xs text-neutral-400 leading-relaxed">{item.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Tools List - Line by Line */}
                      <div className="p-2">
                        {item.tools.map((tool, idx) => {
                          const toolId = `${item.mode}-${idx}`;
                          const isToolExpanded = expandedTool === toolId;
                          const ToolIcon = tool.icon;

                          return (
                            <div key={idx} className="mb-1">
                              {/* Tool Button - FIXED: Removed transparency, using solid colors */}
                              <button
                                onClick={() => {
                                  if (tool.action === "upload") {
                                    handleToolClick(tool);
                                  } else {
                                    toggleTool(toolId);
                                  }
                                }}
                                className="group w-full flex items-center justify-between rounded-lg px-3 py-2 text-left transition-all duration-200 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 hover:border-neutral-500 text-neutral-200 hover:text-white"
                              >
                                <div className="flex items-center space-x-3">
                                  <ToolIcon className="w-4 h-4 text-neutral-300 group-hover:text-white transition-colors" />
                                  <span className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">
                                    {tool.name}
                                  </span>
                                </div>

                                {tool.action !== "upload" && (
                                  <ChevronDown
                                    className={`h-3 w-3 text-neutral-400 transition-transform duration-200 ${isToolExpanded ? "rotate-180" : ""
                                      }`}
                                  />
                                )}
                              </button>

                              {/* Tool Details Dropdown */}
                              {isToolExpanded && tool.action !== "upload" && (
                                <div className="mt-1 ml-4 animate-in slide-in-from-top-1 duration-200">
                                  <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-3">
                                    <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                                      {tool.description}
                                    </p>
                                    <div className="flex flex-col space-y-2">
                                      {/* Upload Image Option - only for certain tools */}
                                      {["image", "stamp", "rectangle"].includes(tool.toolType) && (
                                        <button
                                          onClick={() => fileInputRef.current?.click()}
                                          className="flex items-center space-x-2 px-3 py-2 rounded-md bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 hover:border-neutral-500 transition-all duration-200 text-left"
                                        >
                                          <Upload className="w-3 h-3 text-neutral-300" />
                                          <span className="text-xs text-neutral-300">Upload Image</span>
                                        </button>
                                      )}

                                      {/* Activate Tool - BULLETPROOF: Inline styles for blue theme */}
                                      <button
                                        onClick={() => handleToolClick(tool)}
                                        className="flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 text-left"
                                        style={{
                                          backgroundColor: '#1D4ED8',
                                          borderColor: '#2563EB',
                                          borderWidth: '1px',
                                          borderStyle: 'solid',
                                          color: '#DBEAFE'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#2563EB';
                                          e.currentTarget.style.borderColor = '#3B82F6';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#1D4ED8';
                                          e.currentTarget.style.borderColor = '#2563EB';
                                        }}
                                      >
                                        <ToolIcon className="w-3 h-3" style={{ color: '#DBEAFE' }} />
                                        <span className="text-xs" style={{ color: '#DBEAFE' }}>Activate {tool.name}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Upload status */}
        {uploadedFileName && !collapsed && (
          <div className="px-3 md:px-4 py-3 border-t border-neutral-800 bg-neutral-800">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-neutral-300 truncate">{uploadedFileName}</span>
            </div>
          </div>
        )}

        {/* Drag overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-neutral-900/80 border-2 border-dashed border-neutral-400 rounded-lg flex items-center justify-center z-50">
            <div className="text-center">
              <Upload className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-neutral-300 font-medium">Drop file to upload</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}