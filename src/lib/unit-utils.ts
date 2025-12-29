// src/lib/unit-utils.ts
// Phase 8D.1: Unit utilities for serial key computation and validation

/**
 * Computes a unique serial key from brand, model, and manufacturer serial.
 * Format: BRAND-MODEL-SERIAL (normalized and collision-safe)
 */
export function computeUniqueSerialKey(brand: string, model: string, manufacturerSerial: string): string {
  // Normalize inputs: uppercase, trim, replace spaces/special chars with dashes
  const normalize = (str: string) =>
    str.toUpperCase()
       .trim()
       .replace(/[^A-Z0-9]/g, '-')
       .replace(/-+/g, '-') // collapse multiple dashes
       .replace(/^-|-$/g, ''); // remove leading/trailing dashes

  const normalizedBrand = normalize(brand);
  const normalizedModel = normalize(model);
  const normalizedSerial = normalize(manufacturerSerial);

  if (!normalizedBrand || !normalizedModel || !normalizedSerial) {
    throw new Error('Brand, model, and manufacturer serial are required for unique serial key computation');
  }

  return `${normalizedBrand}-${normalizedModel}-${normalizedSerial}`;
}

/**
 * Generates a unique tag code for units without manufacturer serial.
 * Format: SS-[TYPE]-[NUMBER] where TYPE is M for machines, P for parts
 */
export function generateTagCode(type: 'M' | 'P'): string {
  // In a real implementation, this would check the database for the next available number
  // For now, return a placeholder format
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `SS-${type}-${timestamp}${random}`;
}

/**
 * Validates that a unit has proper serial/tag identification
 */
export function validateUnitIdentification(unit: {
  manufacturerSerial?: string | null;
  tagCode?: string | null;
  productSerialRequired: boolean;
}): { isValid: boolean; error?: string } {
  const hasManufacturerSerial = unit.manufacturerSerial && unit.manufacturerSerial.trim().length > 0;
  const hasTagCode = unit.tagCode && unit.tagCode.trim().length > 0;

  if (unit.productSerialRequired) {
    if (!hasManufacturerSerial) {
      return { isValid: false, error: 'Manufacturer serial is required for this product' };
    }
  } else {
    // For non-serial-required products, we need either manufacturer serial OR tag code
    if (!hasManufacturerSerial && !hasTagCode) {
      return { isValid: false, error: 'Either manufacturer serial or tag code is required' };
    }
  }

  return { isValid: true };
}

/**
 * Checks if a unit status is terminal (cannot be changed from)
 */
export function isTerminalStatus(status: string): boolean {
  const terminalStatuses = ['SOLD', 'SCRAPPED', 'RETURNED_TO_SUPPLIER', 'RETURNED_TO_CUSTOMER'];
  return terminalStatuses.includes(status);
}

/**
 * Validates unit creation/update data
 */
export function validateUnitData(data: {
  ownershipType: string;
  productId?: string | null;
  brand: string;
  model: string;
  manufacturerSerial?: string | null;
  tagCode?: string | null;
  ownerPartyId?: string | null;
  productSerialRequired?: boolean;
}): { isValid: boolean; error?: string; uniqueSerialKey?: string } {
  // Validate required fields
  if (!data.brand || !data.model) {
    return { isValid: false, error: 'Brand and model are required' };
  }

  // Validate ownership-specific requirements
  if (data.ownershipType === 'OWNED' || data.ownershipType === 'RENTED_IN') {
    if (!data.productId) {
      return { isValid: false, error: 'Product is required for OWNED and RENTED_IN units' };
    }
  }

  if (data.ownershipType === 'CUSTOMER_OWNED') {
    if (!data.ownerPartyId) {
      return { isValid: false, error: 'Owner party is required for CUSTOMER_OWNED units' };
    }
  }

  // Validate serial/tag identification
  if (data.productId && data.productSerialRequired !== undefined) {
    const identification = validateUnitIdentification({
      manufacturerSerial: data.manufacturerSerial,
      tagCode: data.tagCode,
      productSerialRequired: data.productSerialRequired
    });

    if (!identification.isValid) {
      return { isValid: false, error: identification.error };
    }
  }

  // Compute unique serial key if we have manufacturer serial
  let uniqueSerialKey: string | undefined;
  if (data.manufacturerSerial) {
    try {
      uniqueSerialKey = computeUniqueSerialKey(data.brand, data.model, data.manufacturerSerial);
    } catch (error) {
      return { isValid: false, error: (error as Error).message };
    }
  }

  return { isValid: true, uniqueSerialKey };
}
