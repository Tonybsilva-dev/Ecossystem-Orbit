export interface ValidateAccessInput {
  licenseKey: string;
  origin: string;
}

export type Capability = string;

export interface ValidateAccessOutput {
  valid: boolean;
  capabilities: Capability[];
  limits?: unknown;
}
