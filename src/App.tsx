import React, { useState } from 'react';
import { AppHeader } from './components/header/AppHeader';
import { SidebarInspector } from './components/sidebar/SidebarInspector';
import { StructureCanvas } from './components/canvas/StructureCanvas';
import { ExportModal } from './components/export/ExportModal';
import { ExcelImportModal } from './components/import/ExcelImportModal';
import { PhotoImportModal } from './components/import/PhotoImportModal';
import { SettingsModal } from './components/settings/SettingsModal';

export default function App() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isPhotoImportOpen, setIsPhotoImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 font-sans">
      <AppHeader
        onOpenExport={() => setIsExportOpen(true)}
        onOpenExcelImport={() => setIsExcelImportOpen(true)}
        onOpenPhotoImport={() => setIsPhotoImportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <div className="flex-1 flex overflow-hidden relative">
        <SidebarInspector />
        <main className="flex-1 h-full relative">
          <StructureCanvas />
        </main>
      </div>
      {isExportOpen && <ExportModal onClose={() => setIsExportOpen(false)} />}
      {isExcelImportOpen && <ExcelImportModal onClose={() => setIsExcelImportOpen(false)} />}
      {isPhotoImportOpen && (
        <PhotoImportModal
          onClose={() => setIsPhotoImportOpen(false)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}
