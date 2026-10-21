import React, { useState } from 'react';
import { useStructureStore } from '../../store/useStructureStore';
import { Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { buildEntityHierarchy, HierarchyNode } from '../../utils/treeHierarchy';
import { getEntityTypeColor } from '../../utils/entityStyle';

export interface TreeItemRowProps {
  node: HierarchyNode;
  isCollapsed: boolean;
  isSelected: boolean;
  isReadOnly?: boolean;
  onToggleCollapse: (id: string) => void;
  onSelect: (id: string) => void;
  onAddChild: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

export const TreeItemRow: React.FC<TreeItemRowProps> = ({
  node,
  isCollapsed,
  isSelected,
  isReadOnly,
  onToggleCollapse,
  onSelect,
  onAddChild,
  onDelete,
}) => {
  const { entity, depth, ownershipPercentage, additionalParentsCount, children } = node;
  const hasChildren = children.length > 0;
  const entityColors = getEntityTypeColor(entity.type);
  // Visual indent: 16px per depth level
  const indentPaddingLeft = `${depth * 16}px`;

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? !isCollapsed : undefined}
      aria-selected={isSelected}
      onClick={() => onSelect(entity.id)}
      style={{ paddingLeft: indentPaddingLeft }}
      className={`group relative rounded-lg border text-xs cursor-pointer transition flex items-center justify-between p-2 my-1 ${
        isSelected
          ? 'bg-sky-50 border-sky-400 shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-center gap-1.5 truncate pr-2 min-w-0 flex-1">
        {hasChildren ? (
          <button
            type="button"
            aria-label={isCollapsed ? `Expand ${entity.name}` : `Collapse ${entity.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(entity.id);
            }}
            className="p-0.5 rounded hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 transition flex-shrink-0"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        ) : (
          <span className="w-3.5 h-3.5 flex-shrink-0 inline-block" aria-hidden="true" />
        )}

        <div className="truncate min-w-0">
          <div className="font-semibold text-slate-800 truncate flex items-center gap-1.5">
            <span className="truncate">{entity.name}</span>
            {additionalParentsCount > 0 && (
              <span
                title={`Co-owned by ${additionalParentsCount} additional parent entity`}
                className="font-tabular text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.2 rounded border border-slate-200 flex-shrink-0"
              >
                +{additionalParentsCount} parent{additionalParentsCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
            <span className={`font-semibold px-1 py-0.2 rounded text-[10px] ${entityColors.badgeBg} ${entityColors.badgeText}`}>
              {entity.type}
            </span>
            <span className="text-slate-300">•</span>
            <span className="truncate">{entity.jurisdiction}</span>
            {ownershipPercentage !== undefined && (
              <>
                <span className="text-slate-300">•</span>
                <span className="font-tabular text-emerald-700 font-bold">{ownershipPercentage}%</span>
              </>
            )}
          </div>
        </div>
      </div>

      {!isReadOnly && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            title="Add Subsidiary to this entity"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(entity.id);
            }}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-sky-600 transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Delete Entity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(entity.id, entity.name);
            }}
            className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export const TreeOutlineTab: React.FC = () => {
  const entities = useStructureStore((state) => state.entities);
  const relationships = useStructureStore((state) => state.relationships);
  const selectedEntityId = useStructureStore((state) => state.selectedEntityId);
  const setSelectedEntityId = useStructureStore((state) => state.setSelectedEntityId);
  const addEntity = useStructureStore((state) => state.addEntity);
  const deleteEntity = useStructureStore((state) => state.deleteEntity);
  const isReadOnly = useStructureStore((state) => state.isReadOnly);

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [deletingEntity, setDeletingEntity] = useState<{ id: string; name: string } | null>(null);

  const handleToggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddChild = (parentId: string) => {
    addEntity(
      {
        name: 'New Subsidiary Entity',
        type: 'Operating Company',
        jurisdiction: 'Cayman Islands',
        status: 'Active',
        associatedParties: [],
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
      associatedParties: [],
    });
  };

  const confirmDeleteEntity = () => {
    deleteEntity(deletingEntity!.id);
    setDeletingEntity(null);
  };

  const hierarchyForest = buildEntityHierarchy(entities, relationships);

  const renderTreeNodes = (nodes: HierarchyNode[]): React.ReactNode => {
    return nodes.map((node) => {
      const isCollapsed = collapsedIds.has(node.entity.id);
      return (
        <React.Fragment key={node.entity.id}>
          <TreeItemRow
            node={node}
            isCollapsed={isCollapsed}
            isSelected={selectedEntityId === node.entity.id}
            isReadOnly={isReadOnly}
            onToggleCollapse={handleToggleCollapse}
            onSelect={setSelectedEntityId}
            onAddChild={handleAddChild}
            onDelete={(id, name) => setDeletingEntity({ id, name })}
          />
          {!isCollapsed && node.children.length > 0 && renderTreeNodes(node.children)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Entities ({entities.length})
        </span>
        {!isReadOnly && (
          <button
            onClick={handleAddNewRoot}
            className="flex items-center gap-1 text-xs bg-sky-600 hover:bg-sky-700 text-white px-2 py-1 rounded font-medium transition"
          >
            <Plus className="w-3 h-3" /> Add Entity
          </button>
        )}
      </div>

      <div
        role="tree"
        aria-label="Fiduciary Entity Hierarchy"
        className="space-y-0.5 overflow-y-auto max-h-[calc(100vh-220px)] pr-1"
      >
        {renderTreeNodes(hierarchyForest)}
      </div>

      {deletingEntity && (
        <ConfirmationModal
          isOpen={true}
          title="Delete Fiduciary Entity"
          message={`Are you sure you want to delete "${deletingEntity.name}"? All associated ownership links and roles connected to this vehicle will be removed from the chart.`}
          confirmLabel="Delete Entity"
          cancelLabel="Keep Entity"
          variant="danger"
          onConfirm={confirmDeleteEntity}
          onCancel={() => setDeletingEntity(null)}
        />
      )}
    </div>
  );
};
