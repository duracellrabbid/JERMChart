import React, { useState } from 'react';
import { TreeOutlineTab } from './TreeOutlineTab';
import { EntityDetailsTab } from './EntityDetailsTab';
import { DirectorsDirectoryTab } from './DirectorsDirectoryTab';
import { FolderTree, FileEdit, Users, ChevronLeft, ChevronRight } from 'lucide-react';

type Tab = 'tree' | 'details' | 'directors';

export const SidebarInspector: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('tree');
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="absolute top-16 left-2 z-10 p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:text-slate-900"
        title="Open Sidebar"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="w-[340px] h-full bg-white border-r border-slate-200 flex flex-col z-10 shadow-sm">
      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-2 pt-2 bg-slate-50">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-md border-b-2 transition ${
              activeTab === 'tree'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" /> Tree
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-md border-b-2 transition ${
              activeTab === 'details'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" /> Details
          </button>
          <button
            data-testid="tab-directors"
            onClick={() => setActiveTab('directors')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-md border-b-2 transition ${
              activeTab === 'directors'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Directors
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="p-3 flex-1 overflow-hidden">
        {activeTab === 'tree' && <TreeOutlineTab />}
        {activeTab === 'details' && <EntityDetailsTab />}
        {activeTab === 'directors' && <DirectorsDirectoryTab />}
      </div>
    </div>
  );
};
