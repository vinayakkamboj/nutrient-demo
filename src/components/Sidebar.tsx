// Sidebar.tsx
import { useRef, useState, useEffect } from "react";
import {
  FileText,
  PenLine,
  ListChecks,
  Edit3,
  Upload,
  ChevronDown,
  Eye,
  Highlighter,
  FileCheck,
  Scissors,
  LayoutDashboard,
  X,
} from "lucide-react";
import type { ViewerMode } from "./PDFViewer";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onSelectMode: (mode: ViewerMode) => void;
  activeMode: ViewerMode;
  onFileUpload: (url: string) => void;
}

interface FeatureItem {
  name: string;
  icon: any;
  mode: ViewerMode;
  description: string;
  features: string[];
  detailIcon: any;
}

const items: FeatureItem[] = [
  {
    name: "Viewer",
    icon: FileText,
    mode: "VIEWER",
    description: "Fast, accurate, and reliable document rendering in your browser. View PDFs, image files, and MS Office documents within a flexible and fully customizable UI.",
    features: ["Zoom & Pan", "Page Navigation", "Search Text", "Bookmarks"],
    detailIcon: Eye,
  },
  {
    name: "Annotations",
    icon: PenLine,
    mode: "ANNOTATIONS",
    description: "A plug-and-play PDF annotation library with more than 15 tools that lets you highlight, draw, and add shapes, texts, notes, comments, and more.",
    features: ["Annotation", "Draw", "Draw Shapes", "Sticky Notes"],
    detailIcon: Highlighter,
  },
  {
    name: "Forms",
    icon: ListChecks,
    mode: "FORMS",
    description: "Easily create, view, and fill PDF forms. Capture data on your server, or flatten it into a PDF. Supports checkboxes, combo boxes, list boxes, and more.",
    features: ["Fill Fields", "Validate Data", "Export Forms"],
    detailIcon: FileCheck,
  },
  {
    name: "Editor",
    icon: Edit3,
    mode: "EDITOR",
    description: "Quickly deploy PDF editing features in your application. Edit PDF text and manipulate pages directly in the browser: add, merge, rotate, reorder, and delete document pages.",
    features: ["Annotations",  "Rearrange Pages"],
    detailIcon: Scissors,
  },
];

export function Sidebar({
  collapsed,
  onToggle,
  onSelectMode,
  activeMode,
  onFileUpload,
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [expandedDropdown, setExpandedDropdown] = useState<ViewerMode | null>(null);
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
          "bg-[#16181d] text-neutral-100 border-r border-neutral-800/70 " +
          (collapsed 
            ? "w-12 md:w-16" 
            : isMobile 
              ? "w-64 fixed left-0 top-0 bottom-0 shadow-2xl" 
              : "w-72"
          )
        }
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Mobile close button */}
        {!collapsed && isMobile && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onToggle}
              className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors"
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
                "bg-[#181a1e] hover:bg-[#22252b] " +
                "rounded-r-md transition-all duration-200 border border-neutral-800 " +
                "group shadow-lg"
              : "absolute top-1/2 -right-4 -translate-y-1/2 cursor-pointer z-45 " +
                "flex items-center justify-center h-14 w-4 " +
                "bg-[#181a1e] hover:bg-[#22252b] " +
                "rounded-r-md transition-all duration-200 border border-neutral-800 " +
                "group shadow-lg"
          }
        >
          <div className="flex flex-col items-center space-y-1">
            <div className={`${isMobile ? 'w-2 h-0.5' : 'w-2.5 h-0.5'} bg-neutral-500 group-hover:bg-neutral-300 transition-colors rounded-full`} />
            <div className={`${isMobile ? 'w-2 h-0.5' : 'w-2.5 h-0.5'} bg-neutral-500 group-hover:bg-neutral-300 transition-colors rounded-full`} />
            <div className={`${isMobile ? 'w-2 h-0.5' : 'w-2.5 h-0.5'} bg-neutral-500 group-hover:bg-neutral-300 transition-colors rounded-full`} />
          </div>
        </div>

        {/* Header */}
        <div className={`px-3 md:px-4 ${isMobile ? 'py-4 pt-6' : 'py-6'} border-b border-neutral-800/50 flex items-center justify-center`}>
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
                <button
                  title={collapsed ? item.name : undefined}
                  onClick={() => {
                    onSelectMode(item.mode);
                    if (!collapsed && !isMobile) setExpandedDropdown(item.mode);
                  }}
                  className={
                    "group relative w-full flex items-center rounded-lg px-2 md:px-3 py-2 md:py-3 text-xs md:text-[13px] font-medium font-['Inter'] transition-all duration-200 " +
                    (isActive
                      ? "bg-neutral-800/80 text-white shadow-lg border border-neutral-700/50"
                      : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white") +
                    (collapsed ? " justify-center" : " justify-between")
                  }
                >
                  <div className="flex items-center">
                    <Icon
                      className={`h-4 md:h-[18px] w-4 md:w-[18px] flex-shrink-0 transition-colors ${
                        isActive
                          ? "text-neutral-300"
                          : "text-neutral-400 group-hover:text-neutral-300"
                      }`}
                    />
                    {!collapsed && <span className="ml-2 md:ml-3 tracking-tight">{item.name}</span>}
                  </div>

                  {!collapsed && !isMobile && (
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
                      className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-neutral-700/50 rounded cursor-pointer select-none"
                    >
                      <ChevronDown
                        className={`h-3 w-3 text-neutral-400 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  )}

                  <span
                    className={`pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-gradient-to-b from-neutral-300 to-neutral-400 transition-opacity duration-200 ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </button>

                {/* Dropdown content - hidden on mobile */}
                {isExpanded && !collapsed && !isMobile && (
                  <div className="mt-2 mx-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-[#1a1d23] rounded-lg border border-neutral-700/50 shadow-xl overflow-hidden">
                      <div className="p-4 border-b border-neutral-700/30">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-neutral-800/50 flex items-center justify-center flex-shrink-0">
                            <item.detailIcon className="w-4 h-4 text-neutral-300" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-white mb-1">{item.name} Mode</h4>
                            <p className="text-xs text-neutral-400 leading-relaxed">{item.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <h5 className="text-xs font-medium text-neutral-300 mb-3 uppercase tracking-wider">
                          Features
                        </h5>
                        <div className="space-y-2">
                          {item.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center space-x-3 group/feature">
                              <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 group-hover/feature:bg-neutral-300 transition-colors" />
                              <span className="text-xs text-neutral-400 group-hover/feature:text-neutral-300 transition-colors">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Upload area */}
                      {isActive && (
                        <div className="mt-4 animate-in slide-in-from-top-3 duration-500">
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-300 group/upload ${
                              dragActive
                                ? "border-neutral-400 bg-neutral-700/20"
                                : "border-neutral-600 hover:border-neutral-400 hover:bg-neutral-800/30"
                            }`}
                          >
                            <div className="relative">
                              <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-neutral-800/50 flex items-center justify-center group-hover/upload:bg-neutral-700/50 transition-colors">
                                <Upload className="h-5 w-5 text-neutral-300 group-hover/upload:text-neutral-200 transition-colors" />
                              </div>

                              <p className="text-[12px] font-medium text-neutral-300 mb-1 group-hover/upload:text-white transition-colors">
                                {uploadedFileName
                                  ? `Uploaded: ${uploadedFileName}`
                                  : "Drop files here or "}
                                {!uploadedFileName && (
                                  <span className="text-neutral-300 group-hover/upload:text-neutral-200">
                                    browse
                                  </span>
                                )}
                              </p>

                              <div className="flex items-center justify-center space-x-3 text-[10px] text-neutral-500">
                                <span className="px-2 py-1 bg-neutral-800/50 rounded text-neutral-400">PDF</span>
                                <span className="px-2 py-1 bg-neutral-800/50 rounded text-neutral-400">JPG</span>
                                <span className="px-2 py-1 bg-neutral-800/50 rounded text-neutral-400">PNG</span>
                              </div>
                            </div>

                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Upload area for mobile - simplified */}
        {!collapsed && isMobile && (
          <div className="px-3 py-4 border-t border-neutral-800/50">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all duration-300 ${
                dragActive
                  ? "border-neutral-400 bg-neutral-700/20"
                  : "border-neutral-600 hover:border-neutral-400 hover:bg-neutral-800/30"
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                <Upload className="h-4 w-4 text-neutral-300" />
                <div className="text-left">
                  <p className="text-xs font-medium text-neutral-300">
                    {uploadedFileName ? uploadedFileName : "Upload File"}
                  </p>
                  <div className="flex space-x-1 mt-1">
                    <span className="text-[9px] px-1 py-0.5 bg-neutral-800/50 rounded text-neutral-400">PDF</span>
                    <span className="text-[9px] px-1 py-0.5 bg-neutral-800/50 rounded text-neutral-400">JPG</span>
                    <span className="text-[9px] px-1 py-0.5 bg-neutral-800/50 rounded text-neutral-400">PNG</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer - hidden on mobile when collapsed */}
        {!collapsed && (
          <div className="px-3 md:px-4 py-3 border-t border-neutral-800/50">
            <div className="flex items-center justify-between text-[10px] text-neutral-500">
              <span className="font-medium">Select the tool</span>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>Online</span>
              </div>
            </div>
          </div>
        )}

        {/* Drag overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-neutral-700/10 border-2 border-dashed border-neutral-400 rounded-lg backdrop-blur-sm flex items-center justify-center z-40">
            <div className="text-center">
              <Upload className="h-10 w-10 text-neutral-300 mx-auto mb-2 animate-bounce" />
              <p className="text-sm font-medium text-white mb-1">Drop your files here</p>
              <p className="text-xs text-neutral-400">PDF, JPG, PNG, TIF supported</p>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff"
          className="hidden"
          onChange={handleFileChange}
        />
      </aside>
    </>
  );
}