import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { User, X } from 'lucide-react';
import { useStructureStore } from '../../store/useStructureStore';
import { StagedNodeData } from '../../types/structure';

export const StagedPersonNode = memo(({ id, data }: NodeProps) => {
  const staged = data as unknown as StagedNodeData;
  const unstageNode = useStructureStore((state) => state.unstageNode);
  const isReadOnly = useStructureStore((state) => state.isReadOnly);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    unstageNode(id);
  };

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
        <div className="font-semibold text-slate-800 text-[11px] truncate">
          {staged.name || 'New Person'}
        </div>
        <div className="text-[9px] text-purple-600 font-medium">
          {staged.role || 'Unassigned Role'}
        </div>
      </div>

      {!isReadOnly && (
        <button
          type="button"
          onClick={handleDelete}
          className="text-slate-400 hover:text-red-500 p-0.5 rounded transition"
          title="Remove staged person"
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
