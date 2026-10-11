import { create } from 'zustand';
import {
  AssociatedParty,
  AssociationLineStyle,
  ChartMetadata,
  EntityNodeData,
  OwnershipEdgeData,
  SiblingSortCriteria,
  TrustStructureChart,
} from '../types/structure';
import { sampleTrustStructure } from '../data/sampleStructure';

export interface OcrReviewState {
  summary: string;
  warnings: string[];
}

export interface StructureState {
  metadata: ChartMetadata;
  entities: EntityNodeData[];
  relationships: OwnershipEdgeData[];
  selectedEntityId: string | null;
  highlightedParty: string | null;
  highlightedDirector: string | null;
  sortCriteria: SiblingSortCriteria;
  undoSnapshot: TrustStructureChart | null;
  ocrReviewState: OcrReviewState | null;
  directorCap: number | 'all';
  isExportMode: boolean;
  associationLineStyle: AssociationLineStyle;
  undoHistory: TrustStructureChart[];
  redoHistory: TrustStructureChart[];

  // Actions
  setMetadata: (meta: Partial<ChartMetadata>) => void;
  setSelectedEntityId: (id: string | null) => void;
  setHighlightedParty: (partyName: string | null) => void;
  setHighlightedDirector: (directorName: string | null) => void;
  setSortCriteria: (criteria: SiblingSortCriteria) => void;
  setDirectorCap: (cap: number | 'all') => void;
  setExportMode: (isExport: boolean) => void;
  setAssociationLineStyle: (style: AssociationLineStyle) => void;
  setUndoSnapshot: (snapshot: TrustStructureChart | null) => void;
  restoreUndoSnapshot: () => boolean;
  pushHistory: () => void;
  undo: () => boolean;
  redo: () => boolean;
  setOcrReviewState: (state: OcrReviewState | null) => void;
  dismissOcrReview: () => void;

  // Entity mutations
  addEntity: (entity: Omit<EntityNodeData, 'id'>, parentId?: string, ownershipPct?: number) => EntityNodeData;
  updateEntity: (id: string, updates: Partial<EntityNodeData>) => void;
  deleteEntity: (id: string) => void;

  // Associated Party mutations
  addAssociatedParty: (entityId: string, party: Omit<AssociatedParty, 'id'>) => void;
  removeAssociatedParty: (entityId: string, partyId: string) => void;
  addDirector: (entityId: string, director: Omit<AssociatedParty, 'id'>) => void;
  removeDirector: (entityId: string, directorId: string) => void;

  // Relationship mutations
  addRelationship: (rel: Omit<OwnershipEdgeData, 'id'>) => void;
  updateRelationship: (id: string, updates: Partial<OwnershipEdgeData>) => void;
  deleteRelationship: (id: string) => void;

  // Full state import/export
  loadStructure: (chart: TrustStructureChart) => void;
  resetToSample: () => void;
  clearCanvas: () => void;
}

const initialSample = structuredClone(sampleTrustStructure);

export const useStructureStore = create<StructureState>((set, get) => ({
  metadata: initialSample.metadata,
  entities: initialSample.entities,
  relationships: initialSample.relationships,
  selectedEntityId: null,
  highlightedParty: null,
  highlightedDirector: null,
  sortCriteria: 'alphabetical',
  undoSnapshot: null,
  ocrReviewState: null,
  directorCap: 3,
  isExportMode: false,
  associationLineStyle: 'dotted',
  undoHistory: [],
  redoHistory: [],

  setMetadata: (meta) =>
    set((state) => ({ metadata: { ...state.metadata, ...meta } })),

  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  setHighlightedParty: (partyName) =>
    set({ highlightedParty: partyName, highlightedDirector: partyName }),
  setHighlightedDirector: (directorName) =>
    set({ highlightedParty: directorName, highlightedDirector: directorName }),
  setSortCriteria: (criteria) => set({ sortCriteria: criteria }),
  setDirectorCap: (cap) => set({ directorCap: cap }),
  setExportMode: (isExport) => set({ isExportMode: isExport }),
  setAssociationLineStyle: (style) => set({ associationLineStyle: style }),

  setUndoSnapshot: (snapshot) => set({ undoSnapshot: snapshot }),

  pushHistory: () => {
    const { metadata, entities, relationships, undoHistory } = get();
    const current: TrustStructureChart = {
      metadata: structuredClone(metadata),
      entities: structuredClone(entities),
      relationships: structuredClone(relationships),
    };
    const nextHistory = [...undoHistory.slice(-19), current];
    set({ undoHistory: nextHistory, redoHistory: [] });
  },

  undo: () => {
    const { undoHistory, redoHistory, metadata, entities, relationships } = get();
    if (undoHistory.length === 0) return false;
    const previous = undoHistory[undoHistory.length - 1];
    const newUndo = undoHistory.slice(0, -1);
    const current: TrustStructureChart = {
      metadata: structuredClone(metadata),
      entities: structuredClone(entities),
      relationships: structuredClone(relationships),
    };
    set({
      metadata: { ...previous.metadata },
      entities: [...previous.entities],
      relationships: [...previous.relationships],
      undoHistory: newUndo,
      redoHistory: [current, ...redoHistory.slice(0, 19)],
    });
    return true;
  },

  redo: () => {
    const { undoHistory, redoHistory, metadata, entities, relationships } = get();
    if (redoHistory.length === 0) return false;
    const next = redoHistory[0];
    const newRedo = redoHistory.slice(1);
    const current: TrustStructureChart = {
      metadata: structuredClone(metadata),
      entities: structuredClone(entities),
      relationships: structuredClone(relationships),
    };
    set({
      metadata: { ...next.metadata },
      entities: [...next.entities],
      relationships: [...next.relationships],
      undoHistory: [...undoHistory.slice(-19), current],
      redoHistory: newRedo,
    });
    return true;
  },

  restoreUndoSnapshot: () => {
    const snapshot = get().undoSnapshot;
    if (!snapshot) return false;
    set({
      metadata: { ...snapshot.metadata },
      entities: [...snapshot.entities],
      relationships: [...snapshot.relationships],
      undoSnapshot: null,
      ocrReviewState: null,
      selectedEntityId: null,
      highlightedParty: null,
      highlightedDirector: null,
      isExportMode: false,
    });
    return true;
  },

  setOcrReviewState: (state) => set({ ocrReviewState: state }),
  dismissOcrReview: () => set({ ocrReviewState: null }),

  addEntity: (entityData, parentId, ownershipPct = 100) => {
    get().pushHistory();
    const newId = `entity-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newEntity: EntityNodeData = {
      ...entityData,
      id: newId,
      associatedParties: entityData.associatedParties || [],
      ubosOrBeneficiaries: entityData.ubosOrBeneficiaries || [],
    };

    set((state) => {
      const nextEntities = [...state.entities, newEntity];
      let nextRels = state.relationships;
      if (parentId) {
        nextRels = [
          ...nextRels,
          {
            id: `rel-${parentId}-${newId}`,
            source: parentId,
            target: newId,
            ownershipPercentage: ownershipPct,
            shareClass: 'Ordinary Shares',
          },
        ];
      }
      return { entities: nextEntities, relationships: nextRels, selectedEntityId: newId };
    });

    return newEntity;
  },

  updateEntity: (id, updates) => {
    get().pushHistory();
    set((state) => ({
      entities: state.entities.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  },

  deleteEntity: (id) => {
    get().pushHistory();
    set((state) => ({
      entities: state.entities.filter((e) => e.id !== id),
      relationships: state.relationships.filter((r) => r.source !== id && r.target !== id),
      selectedEntityId: state.selectedEntityId === id ? null : state.selectedEntityId,
    }));
  },

  addAssociatedParty: (entityId, party) => {
    get().pushHistory();
    set((state) => ({
      entities: state.entities.map((e) => {
        if (e.id !== entityId) return e;
        const newParty: AssociatedParty = {
          ...party,
          id: `party-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          role: party.role || 'Director',
        };
        return { ...e, associatedParties: [...(e.associatedParties || []), newParty] };
      }),
    }));
  },

  removeAssociatedParty: (entityId, partyId) => {
    get().pushHistory();
    set((state) => ({
      entities: state.entities.map((e) => {
        if (e.id !== entityId) return e;
        return {
          ...e,
          associatedParties: (e.associatedParties || []).filter((p) => p.id !== partyId),
        };
      }),
    }));
  },

  addDirector: (entityId, director) =>
    get().addAssociatedParty(entityId, {
      ...director,
      role: director.role || 'Director',
    }),

  removeDirector: (entityId, directorId) =>
    get().removeAssociatedParty(entityId, directorId),

  addRelationship: (rel) => {
    const exists = get().relationships.some((r) => r.source === rel.source && r.target === rel.target);
    if (exists) return;
    get().pushHistory();
    const newRel: OwnershipEdgeData = {
      ...rel,
      id: `rel-${rel.source}-${rel.target}-${Date.now()}`,
    };
    set((state) => ({ relationships: [...state.relationships, newRel] }));
  },

  updateRelationship: (id, updates) => {
    get().pushHistory();
    set((state) => ({
      relationships: state.relationships.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  },

  deleteRelationship: (id) => {
    get().pushHistory();
    set((state) => ({
      relationships: state.relationships.filter((r) => r.id !== id),
    }));
  },

  loadStructure: (chart) => {
    get().pushHistory();
    set({
      metadata: { ...chart.metadata },
      entities: [...chart.entities],
      relationships: [...chart.relationships],
      selectedEntityId: null,
      highlightedParty: null,
      highlightedDirector: null,
    });
  },

  resetToSample: () => {
    const sample = structuredClone(sampleTrustStructure);
    set({
      metadata: sample.metadata,
      entities: sample.entities,
      relationships: sample.relationships,
      selectedEntityId: null,
      highlightedParty: null,
      highlightedDirector: null,
      undoHistory: [],
      redoHistory: [],
    });
  },

  clearCanvas: () => {
    get().pushHistory();
    set({
      metadata: {
        chartTitle: 'New Trust Structure',
        effectiveDate: new Date().toISOString().split('T')[0],
        confidentialityNotice: 'STRICTLY CONFIDENTIAL - PREPARED FOR CLIENT REVIEW ONLY',
      },
      entities: [],
      relationships: [],
      selectedEntityId: null,
      highlightedParty: null,
      highlightedDirector: null,
    });
  },
}));
