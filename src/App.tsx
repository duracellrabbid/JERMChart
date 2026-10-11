import React, { useState, useEffect } from 'react';
import { AppHeader } from './components/header/AppHeader';
import { SidebarInspector } from './components/sidebar/SidebarInspector';
import { StructureCanvas } from './components/canvas/StructureCanvas';
import { ExportModal } from './components/export/ExportModal';
import { ExcelImportModal } from './components/import/ExcelImportModal';
import { PhotoImportModal } from './components/import/PhotoImportModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { useStructureStore } from './store/useStructureStore';

export default function App() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isPhotoImportOpen, setIsPhotoImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const undo = useStructureStore((state) => state.undo);
  const redo = useStructureStore((state) => state.redo);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute('contenteditable') === 'true');
      if (isEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

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
