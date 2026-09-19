import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';

export const OwnershipEdge = memo((props: EdgeProps) => {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
  } = props;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const ownership = data?.ownershipPercentage as number | undefined;
  const shareClass = data?.shareClass as string | undefined;

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          stroke: '#475569',
          strokeWidth: 2,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="flex flex-col items-center justify-center bg-white border border-slate-300 px-2 py-0.5 rounded-full shadow-sm text-[10px] font-semibold text-slate-700 hover:border-sky-500 hover:shadow transition-all cursor-default"
        >
          <span>{ownership !== undefined ? `${ownership}%` : 'Owns'}</span>
          {shareClass && (
            <span className="text-[8px] text-slate-400 -mt-0.5 font-normal max-w-[90px] truncate">
              {shareClass}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
