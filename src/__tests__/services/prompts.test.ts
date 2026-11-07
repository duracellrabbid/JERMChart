import { describe, it, expect } from 'vitest';
import {
  SYSTEM_INSTRUCTION,
  VISION_USER_PROMPT,
  CHART_VISION_SCHEMA,
  cleanBase64Image,
} from '../../services/ai/prompts';

describe('prompts', () => {
  describe('SYSTEM_INSTRUCTION', () => {
    it('is a non-empty string containing extraction instructions', () => {
      expect(typeof SYSTEM_INSTRUCTION).toBe('string');
      expect(SYSTEM_INSTRUCTION).toContain('You are an expert trust, corporate law, and fiduciary chart analyst.');
      expect(SYSTEM_INSTRUCTION).toContain('Extraction Rules:');
    });

    it('contains clear distinction rules between individuals and corporate organizations', () => {
      expect(SYSTEM_INSTRUCTION).toContain('INDIVIDUAL VS ORGANIZATION');
      expect(SYSTEM_INSTRUCTION).toContain('INDIVIDUAL: Represents a natural human person');
      expect(SYSTEM_INSTRUCTION).toContain('NEVER "Holding Company" or "Operating Company"');
      expect(SYSTEM_INSTRUCTION).toContain('ORGANIZATION (CORPORATE ENTITIES)');
    });

    it('enforces corporate suffix precedence rule for entity classification', () => {
      expect(SYSTEM_INSTRUCTION).toContain('Corporate suffix rule:');
      expect(SYSTEM_INSTRUCTION).toContain('George 1 PL');
      expect(SYSTEM_INSTRUCTION).toContain('NEVER an "Individual"');
    });

    it('provides clear guidelines for trust, trust company, and bank entities', () => {
      expect(SYSTEM_INSTRUCTION).toContain('"Trust": Express trusts');
      expect(SYSTEM_INSTRUCTION).toContain('"Trust Company": Corporate trustees');
      expect(SYSTEM_INSTRUCTION).toContain('"Bank": Financial institutions');
    });

    it('instructs model not to invent or hallucinate registration numbers or tax IDs', () => {
      expect(SYSTEM_INSTRUCTION).toContain('Do NOT invent or hallucinate registration numbers or tax IDs');
      expect(SYSTEM_INSTRUCTION).toContain('return empty string ""');
    });
  });

  describe('VISION_USER_PROMPT', () => {
    it('is a non-empty prompt directing the model to analyze structure chart and follow schema', () => {
      expect(typeof VISION_USER_PROMPT).toBe('string');
      expect(VISION_USER_PROMPT).toBe(
        'Analyze this structure chart and extract all entities, relationships, and metadata strictly following the response schema.'
      );
    });
  });

  describe('cleanBase64Image', () => {
    it('strips data:image/png;base64, prefix', () => {
      const input = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA';
      expect(cleanBase64Image(input)).toBe('iVBORw0KGgoAAAANSUhEUgAA');
    });

    it('strips data:image/jpeg;base64, prefix and trims surrounding whitespace', () => {
      const input = '  data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/  ';
      expect(cleanBase64Image(input)).toBe('/9j/4AAQSkZJRgABAQEASABIAAD/');
    });

    it('returns raw base64 string trimmed without data: prefix', () => {
      const input = '  aW1hZ2VkYXRh  ';
      expect(cleanBase64Image(input)).toBe('aW1hZ2VkYXRh');
    });

    it('handles empty string or falsy inputs', () => {
      expect(cleanBase64Image('')).toBe('');
      expect(cleanBase64Image('   ')).toBe('');
      expect(cleanBase64Image(null as unknown as string)).toBe('');
      expect(cleanBase64Image(undefined as unknown as string)).toBe('');
    });

    it('handles data: prefix without comma', () => {
      expect(cleanBase64Image('data:notacomma')).toBe('data:notacomma');
    });
  });

  describe('CHART_VISION_SCHEMA', () => {
    it('is a valid canonical JSON Schema object', () => {
      expect(CHART_VISION_SCHEMA).toBeDefined();
      expect(CHART_VISION_SCHEMA.type).toBe('object');
      expect(CHART_VISION_SCHEMA.required).toEqual(['entities', 'relationships']);
    });

    it('defines properties for chartTitle, clientReference, entities, relationships, and warnings', () => {
      const props = CHART_VISION_SCHEMA.properties as Record<string, any>;
      expect(props).toBeDefined();
      expect(props.chartTitle.type).toBe('string');
      expect(props.clientReference.type).toBe('string');
      expect(props.warnings.type).toBe('array');
      expect(props.warnings.items.type).toBe('string');
    });

    it('defines entities schema with required fields and enums', () => {
      const props = CHART_VISION_SCHEMA.properties as Record<string, any>;
      const entities = props.entities;
      expect(entities.type).toBe('array');
      expect(entities.items.type).toBe('object');
      expect(entities.items.required).toEqual(['tempId', 'name', 'type', 'jurisdiction']);

      const entityProps = entities.items.properties;
      expect(entityProps.tempId.type).toBe('string');
      expect(entityProps.name.type).toBe('string');
      expect(entityProps.type.type).toBe('string');
      expect(entityProps.type.enum).toEqual([
        'Trust',
        'Trust Company',
        'Holding Company',
        'Operating Company',
        'LLC',
        'Foundation',
        'Partnership',
        'Individual',
        'Bank',
      ]);
      expect(entityProps.jurisdiction.type).toBe('string');
      expect(entityProps.registrationNumber.type).toBe('string');
      expect(entityProps.taxId.type).toBe('string');
      expect(entityProps.status.type).toBe('string');
      expect(entityProps.status.enum).toEqual(['Active', 'Dormant', 'In Liquidation', 'Nominee']);
      expect(entityProps.associatedParties.type).toBe('array');
      expect(entityProps.associatedParties.items.required).toEqual(['name', 'role']);
      expect(entityProps.ubosOrBeneficiaries.type).toBe('array');
      expect(entityProps.notes.type).toBe('string');
    });

    it('defines relationships schema with required fields', () => {
      const props = CHART_VISION_SCHEMA.properties as Record<string, any>;
      const rels = props.relationships;
      expect(rels.type).toBe('array');
      expect(rels.items.type).toBe('object');
      expect(rels.items.required).toEqual(['sourceTempId', 'targetTempId', 'ownershipPercentage']);

      const relProps = rels.items.properties;
      expect(relProps.sourceTempId.type).toBe('string');
      expect(relProps.targetTempId.type).toBe('string');
      expect(relProps.ownershipPercentage.type).toBe('number');
      expect(relProps.shareClass.type).toBe('string');
    });
  });
});
