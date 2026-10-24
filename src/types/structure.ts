export type EntityType = 
  | 'Trust' 
  | 'Trust Company'
  | 'Holding Company' 
  | 'Operating Company' 
  | 'LLC' 
  | 'Foundation' 
  | 'Partnership' 
  | 'Individual'
  | 'Bank';

export type EntityStatus = 'Active' | 'Dormant' | 'In Liquidation' | 'Nominee';

export type SiblingSortCriteria = 'alphabetical' | 'ownership' | 'jurisdiction' | 'manual';

export type AssociationLineStyle = 'dotted' | 'solid';

export type AssociatedRole =
  | 'Director'
  | 'Enforcer'
  | 'Settlor'
  | 'Protector'
  | 'Asset Contributor'
  | 'Authorised Signatory'
  | 'Fund Manager'
  | string;

export interface AssociatedParty {
  id: string;
  name: string;
  role: string;
  isCorporate?: boolean;
  appointmentDate?: string;
  isResident?: boolean;
}

export interface EntityNodeData {
  id: string;
  name: string;
  type: EntityType;
  jurisdiction: string;
  registrationNumber?: string;
  taxId?: string;
  status: EntityStatus;
  associatedParties: AssociatedParty[];
  ubosOrBeneficiaries?: string[];
  notes?: string;
  position?: { x: number; y: number };
}

export interface OwnershipEdgeData {
  id: string;
  source: string;
  target: string;
  ownershipPercentage?: number;
  shareClass?: string;
  isCrossLink?: boolean;
}

export interface ChartMetadata {
  chartTitle: string;
  clientReference?: string;
  effectiveDate: string;
  confidentialityNotice: string;
}

export interface StagedNodeData extends Record<string, unknown> {
  id: string;
  kind: 'person' | 'entity';
  name: string;
  role?: string;
  entityType?: EntityType;
  position: { x: number; y: number };
}

export interface TrustStructureChart {
  metadata: ChartMetadata;
  entities: EntityNodeData[];
  relationships: OwnershipEdgeData[];
  stagedNodes?: StagedNodeData[];
}
