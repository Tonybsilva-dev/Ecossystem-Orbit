/**
 * This file contains all TypeScript interfaces and types for the Orbit licensing engine.
 * 
 * These types define the contracts for:
 * - Input/output of the public licensing validation API
 * - Internal data structures used by the licensing engine
 * - Type safety throughout the licensing module
 */

/**
 * Input interface for the public-facing licensing validation function.
 * Consumers must provide a license key and the origin (domain) requesting validation.
 */
export interface ValidateAccessInput {
  licenseKey: string;
  origin: string;
}

/**
 * Type alias for a capability string.
 * Capabilities represent features or permissions that a license grants.
 */
export type Capability = string;

/**
 * Output interface for the licensing validation function.
 * Specifies whether the license is valid and what capabilities it grants.
 */
export interface ValidateAccessOutput {
  valid: boolean;
  capabilities: Capability[];
  limits?: any;
}

/**
 * Internal data context interface for the licensing engine.
 * This structure holds data fetched from the database for validation,
 * decoupling the engine from raw Prisma types.
 */
export interface LicenseValidationContext {
  tenantStatus: string;
  planFeatures: string[];
  tenantFeatureOverrides: string[];
}

