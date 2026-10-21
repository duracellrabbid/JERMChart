import React, { useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStructureStore } from '../../store/useStructureStore';
import { EntityCardNode, SatelliteRoleCard } from '../nodes/EntityCardNode';
import { OwnershipEdge } from '../edges/OwnershipEdge';
import { calculateSortedLayout } from '../../utils/layoutEngine';
import { OcrReviewBanner } from './OcrReviewBanner';
import { FiduciaryLegend } from './FiduciaryLegend';

const nodeTypes = {
  entityNode: EntityCardNode,
  satelliteNode: SatelliteRoleCard,
};

const edgeTypes = {
  ownershipEdge: OwnershipEdge,
};

export const StructureCanvas: React.FC = () => {
  const entities = useStructureStore((state) => state.entities);
  const relationships = useStructureStore((state) => state.relationships);
  const sortCriteria = useStructureStore((state) => state.sortCriteria);
  const directorCap = useStructureStore((state) => state.directorCap);
  const isExportMode = useStructureStore((state) => state.isExportMode);
  const isReadOnly = useStructureStore((state) => state.isReadOnly);
  const addRelationship = useStructureStore((state) => state.addRelationship);
  const setSelectedEntityId = useStructureStore((state) => state.setSelectedEntityId);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Calculate layout on structure, sort criteria, director cap, or export mode change
  const refreshLayout = useCallback(() => {
    const layout = calculateSortedLayout(
      entities,
      relationships,
      sortCriteria,
      directorCap,
      isExportMode
    );
    setNodes(layout.nodes);
    setEdges(layout.edges);
  }, [entities, relationships, sortCriteria, directorCap, isExportMode, setNodes, setEdges]);

  useEffect(() => {
    refreshLayout();
  }, [refreshLayout]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (isReadOnly) return;
      if (
        connection.source &&
        connection.target &&
        connection.source !== connection.target
      ) {
        addRelationship({
          source: connection.source,
          target: connection.target,
          ownershipPercentage: 100,
          shareClass: 'Ordinary Shares',
        });
      }
    },
    [isReadOnly, addRelationship]
  );

  const onPaneClick = useCallback(() => {
    setSelectedEntityId(null);
  }, [setSelectedEntityId]);

  return (
    <div className="relative w-full h-full bg-slate-100" id="trust-structure-canvas">
      <OcrReviewBanner />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesConnectable={!isReadOnly}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
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
