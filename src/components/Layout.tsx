import { useState } from "react"
import { Navbar } from "./Navbar"
import { Sidebar } from "./Sidebar"
import { PDFViewer } from "./PDFViewer"
import type { ViewerMode } from "./PDFViewer"

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mode, setMode] = useState<ViewerMode>("VIEWER")

  // Default docs for each mode
  const docMap: Record<ViewerMode, string> = {
    VIEWER: "/blob.pdf",
    ANNOTATIONS: "/document.pdf",
    FORMS: "/form.pdf",
    EDITOR: "/editor.pdf",
  }

  // Stores uploaded file per mode
  const [customDocs, setCustomDocs] = useState<Partial<Record<ViewerMode, string>>>({})

  const handleFileUpload = (url: string) => {
    setCustomDocs((prev) => ({ ...prev, [mode]: url }))
  }

  const documentUrl = customDocs[mode] ?? docMap[mode]

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-100">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          onSelectMode={(m) => setMode(m)}
          activeMode={mode}
          onFileUpload={handleFileUpload}   // ✅ pass upload callback
        />

        <main className="relative flex-1 overflow-hidden">
          <PDFViewer mode={mode} documentUrl={documentUrl} />
        </main>
      </div>
    </div>
  )
}
