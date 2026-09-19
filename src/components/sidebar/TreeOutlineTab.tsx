import React from 'react';
import { useStructureStore } from '../../store/useStructureStore';
import { Plus, Trash2 } from 'lucide-react';

export const TreeOutlineTab: React.FC = () => {
  const entities = useStructureStore((state) => state.entities);
  const relationships = useStructureStore((state) => state.relationships);
  const selectedEntityId = useStructureStore((state) => state.selectedEntityId);
  const setSelectedEntityId = useStructureStore((state) => state.setSelectedEntityId);
  const addEntity = useStructureStore((state) => state.addEntity);
  const deleteEntity = useStructureStore((state) => state.deleteEntity);

  const handleAddChild = (parentId: string) => {
    addEntity(
      {
        name: 'New Subsidiary Entity',
        type: 'Operating Company',
        jurisdiction: 'Cayman Islands',
        status: 'Active',
        directors: [],
      },
      parentId,
      100
    );
  };

  const handleAddNewRoot = () => {
    addEntity({
      name: 'New Holding Entity',
      type: 'Holding Company',
      jurisdiction: 'BVI',
      status: 'Active',
      directors: [],
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Entities ({entities.length})
        </span>
        <button
          onClick={handleAddNewRoot}
          className="flex items-center gap-1 text-xs bg-sky-600 hover:bg-sky-700 text-white px-2 py-1 rounded font-medium transition"
        >
          <Plus className="w-3 h-3" /> Add Entity
        </button>
      </div>

      <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
        {entities.map((entity) => {
          const isSelected = selectedEntityId === entity.id;
          const incoming = relationships.find((r) => r.target === entity.id);

          return (
            <div
              key={entity.id}
              onClick={() => setSelectedEntityId(entity.id)}
              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                isSelected
                  ? 'bg-sky-50 border-sky-400 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="truncate pr-2">
                <div className="font-semibold text-slate-800 truncate">{entity.name}</div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span className="font-medium text-sky-700">{entity.type}</span>
                  <span>•</span>
                  <span>{entity.jurisdiction}</span>
                  {incoming && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">{incoming.ownershipPercentage}%</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  title="Add Subsidiary to this entity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddChild(entity.id);
                  }}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-sky-600"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  title="Delete Entity"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete ${entity.name}?`)) deleteEntity(entity.id);
                  }}
                  className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
