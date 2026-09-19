import React, { useState } from 'react';
import { AppHeader } from './components/header/AppHeader';
import { SidebarInspector } from './components/sidebar/SidebarInspector';
import { StructureCanvas } from './components/canvas/StructureCanvas';
import { ExportModal } from './components/export/ExportModal';

export default function App() {
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 font-sans">
      <AppHeader onOpenExport={() => setIsExportOpen(true)} />
      <div className="flex-1 flex overflow-hidden relative">
        <SidebarInspector />
        <main className="flex-1 h-full relative">
          <StructureCanvas />
        </main>
      </div>
      {isExportOpen && <ExportModal onClose={() => setIsExportOpen(false)} />}
    </div>
  );
}
