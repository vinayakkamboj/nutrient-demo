// Sidebar.tsx
import { useRef, useState } from "react";
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
    description: "View and navigate PDF documents with smooth scrolling and zoom controls",
    features: ["Zoom & Pan", "Page Navigation", "Search Text", "Bookmarks"],
    detailIcon: Eye,
  },
  {
    name: "Annotations",
    icon: PenLine,
    mode: "ANNOTATIONS",
    description: "Add highlights, comments, and markup tools to collaborate on documents",
    features: ["Highlight Text", "Add Comments", "Draw Shapes", "Sticky Notes"],
    detailIcon: Highlighter,
  },
  {
    name: "Forms",
    icon: ListChecks,
    mode: "FORMS",
    description: "Fill interactive forms, add signatures, and validate form data",
    features: ["Fill Fields", "Digital Signature", "Validate Data", "Export Forms"],
    detailIcon: FileCheck,
  },
  {
    name: "Editor",
    icon: Edit3,
    mode: "EDITOR",
    description: "Edit PDF content, modify text, add images, and rearrange pages",
    features: ["Edit Text", "Add Images", "Rearrange Pages", "Merge PDFs"],
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      console.log("Sidebar: file chosen ->", file.name);
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
      onFileUpload(url);
    }
  };

  const toggleDropdown = (mode: ViewerMode) => {
    if (collapsed) return;
    setExpandedDropdown((prev) => (prev === mode ? null : mode));
  };

  return (
    <aside
      className={
        "relative flex h-full flex-col transition-all duration-300 " +
        "bg-[#16181d] text-neutral-100 border-r border-neutral-800/70 " +
        (collapsed ? "w-24" : "w-80")
      }
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Collapse/Expand pill */}
      <div
        onClick={onToggle}
        className="absolute top-1/2 -right-4 -translate-y-1/2 cursor-pointer z-45
                   flex items-center justify-center h-14 w-4
                   bg-[#181a1e] hover:bg-[#22252b]
                   rounded-r-md transition-all duration-200 border border-neutral-800
                   group shadow-lg"
      >
        <div className="flex flex-col items-center space-y-1">
          <div className="w-2.5 h-0.5 bg-neutral-500 group-hover:bg-neutral-300 transition-colors rounded-full" />
          <div className="w-2.5 h-0.5 bg-neutral-500 group-hover:bg-neutral-300 transition-colors rounded-full" />
          <div className="w-2.5 h-0.5 bg-neutral-500 group-hover:bg-neutral-300 transition-colors rounded-full" />
        </div>
      </div>

      {/* Header - Always present but changes content based on collapsed state */}
<div className="px-4 py-6 border-b border-neutral-800/50 flex items-center justify-center">
  {collapsed ? (
    <div className="flex items-center justify-center">
      <div className="w-8 h-8 rounded-lg bg-transparent flex items-center justify-center shadow-none">
        <LayoutDashboard className="h-4 w-4 text-neutral-400" />
      </div>
    </div>
  ) : (
    <div className="flex items-center space-x-3 w-full">
      <div className="w-8 h-8 rounded-lg bg-transparent flex items-center justify-center shadow-none">
        <LayoutDashboard className="h-4 w-4 text-neutral-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">Tools</h2>
        <p className="text-xs text-neutral-400">Select the feature</p>
      </div>
    </div>
  )}
</div>

      {/* Navigation items */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
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
                  if (!collapsed) setExpandedDropdown(item.mode);
                }}
                className={
                  "group relative w-full flex items-center rounded-lg px-3 py-3 text-[13px] font-medium font-['Inter'] transition-all duration-200 " +
                  (isActive
                    ? "bg-neutral-800/80 text-white shadow-lg border border-neutral-700/50"
                    : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white") +
                  (collapsed ? " justify-center" : " justify-between")
                }
              >
                <div className="flex items-center">
                  <Icon
                    className={`h-[18px] w-[18px] flex-shrink-0 transition-colors ${
                      isActive ? "text-neutral-300" : "text-neutral-400 group-hover:text-neutral-300"
                    }`}
                  />
                  {!collapsed && <span className="ml-3 tracking-tight">{item.name}</span>}
                </div>

                {!collapsed && (
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(item.mode);
                      }}
                      className="p-1 hover:bg-neutral-700/50 rounded transition-colors"
                    >
                      <ChevronDown
                        className={`h-3 w-3 text-neutral-400 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                )}

                <span
                  className={`pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-gradient-to-b from-neutral-300 to-neutral-400 transition-opacity duration-200 ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
              </button>

              {/* Dropdown content */}
              {isExpanded && !collapsed && (
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
                              Drop files here or{" "}
                              <span className="text-neutral-300 group-hover/upload:text-neutral-200">browse</span>
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

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-neutral-800/50">
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
    </aside>
  );
}