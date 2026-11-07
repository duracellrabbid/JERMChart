import React, { memo, useState, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { User, X } from 'lucide-react';
import { useStructureStore } from '../../store/useStructureStore';
import { StagedNodeData } from '../../types/structure';

interface CommitParams {
  id: string;
  name: string;
  updateStagedNode: (id: string, updates: Partial<StagedNodeData>) => void;
  setIsEditing: (editing: boolean) => void;
  setEditName: (name: string) => void;
}

function commitNameEdit({ id, name, updateStagedNode, setIsEditing, setEditName }: CommitParams) {
  const finalName = name.trim() || 'New Person';
  setEditName(finalName);
  updateStagedNode(id, { name: finalName });
  setIsEditing(false);
}

function handleNameInputKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  params: {
    commit: () => void;
    cancel: () => void;
  }
) {
  if (e.key === 'Enter') {
    e.preventDefault();
    params.commit();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    params.cancel();
  }
}

export const StagedPersonNode = memo(({ id, data }: NodeProps) => {
  const stagedFromData = data as unknown as StagedNodeData;
  const stagedFromStore = useStructureStore((state) =>
    state.stagedNodes.find((n) => n.id === id)
  );
  const staged = stagedFromStore || stagedFromData;

  const unstageNode = useStructureStore((state) => state.unstageNode);
  const updateStagedNode = useStructureStore((state) => state.updateStagedNode);
  const isReadOnly = useStructureStore((state) => state.isReadOnly);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(staged.name || 'New Person');

  useEffect(() => {
    setEditName(staged.name || 'New Person');
  }, [staged.name]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      unstageNode(id);
    },
    [id, unstageNode]
  );

  const handleStartEdit = useCallback(
    (e: React.MouseEvent) => {
      if (isReadOnly) return;
      e.stopPropagation();
      setIsEditing(true);
    },
    [isReadOnly]
  );

  const handleCommit = useCallback(() => {
    commitNameEdit({
      id,
      name: editName,
      updateStagedNode,
      setIsEditing,
      setEditName,
    });
  }, [id, editName, updateStagedNode]);

  const handleCancel = useCallback(() => {
    setEditName(staged.name || 'New Person');
    setIsEditing(false);
  }, [staged.name]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      handleNameInputKeyDown(e, {
        commit: handleCommit,
        cancel: handleCancel,
      });
    },
    [handleCommit, handleCancel]
  );

  const displayName = staged.name || 'New Person';
  const displayRole = staged.role || 'Unassigned Role';

  return (
    <div
      data-testid="staged-person-node"
      className="relative px-3 py-2 rounded-lg bg-white/95 border-2 border-dashed border-purple-400 shadow-md flex items-center gap-2 select-none min-w-[140px] text-xs"
    >
      <Handle
        type="source"
        position={Position.Top}
        id="top-in"
        className="!w-2.5 !h-2.5 !bg-purple-600 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-in"
        className="!w-2.5 !h-2.5 !bg-purple-600 !border-2 !border-white"
      />

      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 flex-shrink-0">
        <User className="w-3.5 h-3.5" />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        {isEditing ? (
          <input
            data-testid="staged-person-name-input"
            type="text"
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            maxLength={120}
            className="w-full px-1 py-0.5 text-[11px] font-semibold text-slate-800 bg-white border border-purple-400 rounded outline-none ring-1 ring-purple-500 nodrag nopan"
          />
        ) : (
          <div
            data-testid="staged-person-name"
            onClick={handleStartEdit}
            title={!isReadOnly ? 'Click to edit name' : undefined}
            className={`font-semibold text-slate-800 text-[11px] truncate ${
              !isReadOnly ? 'cursor-pointer hover:text-purple-700' : ''
            }`}
          >
            {displayName}
          </div>
        )}
        <div className="text-[9px] text-purple-600 font-medium">
          {displayRole}
        </div>
      </div>

      {!isReadOnly && (
        <button
          type="button"
          onClick={handleDelete}
          className="text-slate-400 hover:text-red-500 p-0.5 rounded transition"
          title="Remove staged person"
          aria-label="Remove staged person"
          data-testid="remove-staged-person"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="right-out"
        className="!w-2.5 !h-2.5 !bg-purple-600 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-out"
        className="!w-2.5 !h-2.5 !bg-purple-600 !border-2 !border-white"
      />
    </div>
  );
});
