import React, { useEffect, useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  ConnectionMode,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStructureStore } from '../../store/useStructureStore';
import { EntityCardNode, SatelliteRoleCard } from '../nodes/EntityCardNode';
import { StagedPersonNode } from '../nodes/StagedPersonNode';
import { OwnershipEdge } from '../edges/OwnershipEdge';
import { calculateSortedLayout } from '../../utils/layoutEngine';
import { isCycleIntroducingEdge } from '../../utils/graphValidation';
import { OcrReviewBanner } from './OcrReviewBanner';
import { FiduciaryLegend } from './FiduciaryLegend';
import { FloatingShapeDock, ShapeDragPayload } from './FloatingShapeDock';
import {
  ConnectionQuickPicker,
  PendingConnectionInfo,
  ConnectionQuickPickerResult,
} from './ConnectionQuickPicker';

const nodeTypes = {
  entityNode: EntityCardNode,
  satelliteNode: SatelliteRoleCard,
  stagedPersonNode: StagedPersonNode,
};

const edgeTypes = {
  ownershipEdge: OwnershipEdge,
};

function parseShapeDragData(e: React.DragEvent): ShapeDragPayload | null {
  try {
    const raw = e.dataTransfer.getData('application/jermchart-shape');
    return raw ? (JSON.parse(raw) as ShapeDragPayload) : null;
  } catch {
    return null;
  }
}

function findStagedAndEntityPair(
  source: string,
  target: string,
  isSourceEntity: boolean,
  isTargetEntity: boolean,
  isSourceStaged: boolean,
  isTargetStaged: boolean
): { stagedId: string; entityId: string } | null {
  if (isSourceStaged && isTargetEntity) {
    return { stagedId: source, entityId: target };
  }
  if (isTargetStaged && isSourceEntity) {
    return { stagedId: target, entityId: source };
  }
  return null;
}

export const StructureCanvasContent: React.FC = () => {
  const entities = useStructureStore((state) => state.entities);
  const relationships = useStructureStore((state) => state.relationships);
  const stagedNodes = useStructureStore((state) => state.stagedNodes);
  const sortCriteria = useStructureStore((state) => state.sortCriteria);
  const directorCap = useStructureStore((state) => state.directorCap);
  const isExportMode = useStructureStore((state) => state.isExportMode);
  const isReadOnly = useStructureStore((state) => state.isReadOnly);
  const addEntity = useStructureStore((state) => state.addEntity);
  const updateEntity = useStructureStore((state) => state.updateEntity);
  const stageNode = useStructureStore((state) => state.stageNode);
  const updateStagedNodePosition = useStructureStore((state) => state.updateStagedNodePosition);
  const addRelationship = useStructureStore((state) => state.addRelationship);
  const connectStagedPersonToEntity = useStructureStore(
    (state) => state.connectStagedPersonToEntity
  );
  const setSelectedEntityId = useStructureStore((state) => state.setSelectedEntityId);

  const reactFlow = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [pendingConnection, setPendingConnection] = useState<{
    info: PendingConnectionInfo;
    position: { x: number; y: number };
  } | null>(null);
  const [cycleWarning, setCycleWarning] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 400, y: 250 });

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  }, []);

  // Calculate layout on structure, sort criteria, director cap, export mode, or staged nodes change
  const refreshLayout = useCallback(() => {
    const layout = calculateSortedLayout(
      entities,
      relationships,
      sortCriteria,
      directorCap,
      isExportMode
    );

    const stagedReactNodes: Node[] = stagedNodes.map((s) => ({
      id: s.id,
      type: 'stagedPersonNode',
      position: s.position,
      data: s,
    }));

    setNodes([...layout.nodes, ...stagedReactNodes]);
    setEdges(layout.edges);
  }, [entities, relationships, stagedNodes, sortCriteria, directorCap, isExportMode, setNodes, setEdges]);

  useEffect(() => {
    refreshLayout();
  }, [refreshLayout]);

  const handleAddShape = useCallback(
    (payload: ShapeDragPayload) => {
      if (payload.kind === 'entity') {
        addEntity({
          name: `New ${payload.type}`,
          type: payload.type,
          jurisdiction: 'BVI',
          status: 'Active',
          associatedParties: [],
        });
      } else {
        stageNode({
          kind: 'person',
          name: 'New Person',
          role: payload.role,
          position: { x: 300, y: 150 },
        });
      }
    },
    [addEntity, stageNode]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const payload = parseShapeDragData(e);
      if (!payload) return;

      const flowPosition = reactFlow.screenToFlowPosition({ x: e.clientX, y: e.clientY });

      if (payload.kind === 'entity') {
        addEntity({
          name: `New ${payload.type}`,
          type: payload.type,
          jurisdiction: 'BVI',
          status: 'Active',
          associatedParties: [],
        });
      } else {
        stageNode({
          kind: 'person',
          name: 'New Person',
          role: payload.role,
          position: flowPosition,
        });
      }
    },
    [reactFlow, addEntity, stageNode]
  );

  const resolveConnectionAttempt = useCallback(
    (connection: Connection, clientPos: { x: number; y: number }) => {
      const { source, target } = connection;
      if (!source || !target || source === target) return;

      const isSourceEntity = entities.some((e) => e.id === source);
      const isTargetEntity = entities.some((e) => e.id === target);
      const isSourceStaged = stagedNodes.some((s) => s.id === source);
      const isTargetStaged = stagedNodes.some((s) => s.id === target);

      // Case 1: Entity to Entity
      if (isSourceEntity && isTargetEntity) {
        if (isCycleIntroducingEdge(source, target, relationships)) {
          setCycleWarning('Circular ownership loops are not permitted in fiduciary structure charts.');
          return;
        }
        const sourceEnt = entities.find((e) => e.id === source)!;
        const targetEnt = entities.find((e) => e.id === target)!;
        setPendingConnection({
          info: {
            sourceId: source,
            sourceName: sourceEnt.name,
            targetId: target,
            targetName: targetEnt.name,
            connectionKind: 'entity-to-entity',
          },
          position: clientPos,
        });
        return;
      }

      // Case 2: Person to Entity
      const pair = findStagedAndEntityPair(
        source,
        target,
        isSourceEntity,
        isTargetEntity,
        isSourceStaged,
        isTargetStaged
      );

      if (pair) {
        const stagedPerson = stagedNodes.find((s) => s.id === pair.stagedId)!;
        const targetEnt = entities.find((e) => e.id === pair.entityId)!;
        setPendingConnection({
          info: {
            sourceId: pair.stagedId,
            sourceName: stagedPerson.name,
            targetId: pair.entityId,
            targetName: targetEnt.name,
            connectionKind: 'person-to-entity',
          },
          position: clientPos,
        });
      }
    },
    [entities, stagedNodes, relationships]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (isReadOnly) return;
      resolveConnectionAttempt(connection, cursorPos);
    },
    [isReadOnly, resolveConnectionAttempt, cursorPos]
  );

  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      if (!connection.source || !connection.target) return false;
      if (connection.source === connection.target) return false;
      const isSourceStaged = stagedNodes.some((s) => s.id === connection.source);
      const isTargetStaged = stagedNodes.some((s) => s.id === connection.target);
      if (isSourceStaged && isTargetStaged) return false;
      return true;
    },
    [stagedNodes]
  );

  const handleConfirmConnection = useCallback(
    (result: ConnectionQuickPickerResult) => {
      const pending = pendingConnection!;
      const { info } = pending;

      if (result.connectionKind === 'entity-to-entity') {
        if (isCycleIntroducingEdge(result.sourceId, result.targetId, relationships)) {
          setCycleWarning('Circular ownership loops are not permitted in fiduciary structure charts.');
          setPendingConnection(null);
          return;
        }

        addRelationship({
          source: result.sourceId,
          target: result.targetId,
          ownershipPercentage: result.ownershipPercentage,
          shareClass: result.shareClass,
          isCrossLink: result.isCrossLink,
        });
      } else {
        connectStagedPersonToEntity(info.sourceId, info.targetId, {
          role: result.role,
          isResident: result.isResident,
          isCorporate: result.isCorporate,
        });
      }
      setPendingConnection(null);
    },
    [pendingConnection, addRelationship, connectStagedPersonToEntity, relationships]
  );

  const onPaneClick = useCallback(() => {
    setSelectedEntityId(null);
    setPendingConnection(null);
    setCycleWarning(null);
  }, [setSelectedEntityId]);

  const onNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node) => {
      if (isReadOnly) return;
      if (node.type === 'stagedPersonNode') {
        updateStagedNodePosition(node.id, node.position);
      } else if (node.type === 'entityNode') {
        updateEntity(node.id, { position: node.position });
      }
    },
    [isReadOnly, updateStagedNodePosition, updateEntity]
  );

  return (
    <div
      className="relative w-full h-full bg-slate-100"
      id="trust-structure-canvas"
      onPointerMove={handlePointerMove}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <OcrReviewBanner />
      <FloatingShapeDock onAddShape={handleAddShape} />

      {cycleWarning && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-50 border border-amber-300 text-amber-900 px-3.5 py-1.5 rounded-lg shadow-lg text-xs flex items-center gap-2">
          <span>⚠️ {cycleWarning}</span>
          <button
            type="button"
            onClick={() => setCycleWarning(null)}
            className="text-amber-700 hover:text-amber-900 font-bold ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {pendingConnection && (
        <ConnectionQuickPicker
          connection={pendingConnection.info}
          position={pendingConnection.position}
          onConfirm={handleConfirmConnection}
          onCancel={() => setPendingConnection(null)}
        />
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesConnectable={!isReadOnly}
        connectionMode={ConnectionMode.Loose}
        connectionRadius={25}
        isValidConnection={isValidConnection}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.8}
      >
        <Background color="#94a3b8" gap={20} size={1} />
        <Controls className="!bg-white !border !border-slate-300 !shadow-md !rounded-lg" />
        <MiniMap
          nodeColor="#0284c7"
          maskColor="rgba(241, 245, 249, 0.7)"
          className="!border !border-slate-300 !rounded-lg !bg-white"
        />
      </ReactFlow>
      {!isExportMode && <FiduciaryLegend />}
    </div>
  );
};

export const StructureCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <StructureCanvasContent />
    </ReactFlowProvider>
  );
};
