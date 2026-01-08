import { computeUniqueSerialKey, generateTagCode, validateUnitData } from "./unit-utils.ts";

type ProductSnapshot = {
  id: string;
  title: string;
  type: "MACHINE_SALE" | "MACHINE_RENT" | "PART";
  isAssetTracked: boolean;
  serialRequired: boolean;
  brand: string | null;
  model: string | null;
};

export type TrackedLine = {
  product: ProductSnapshot;
  quantity: number;
};

export type IntakeUnitInput = {
  productId: string;
  brand?: string;
  model?: string;
  manufacturerSerial?: string | null;
  tagCode?: string | null;
};

export type PreparedUnit = {
  productId: string;
  brand: string;
  model: string;
  manufacturerSerial: string | null;
  tagCode: string | null;
  uniqueSerialKey: string;
};

function getTagPrefix(productType: ProductSnapshot["type"]) {
  return productType === "PART" ? "P" : "M";
}

export async function prepareTrackedUnits(opts: {
  trackedLines: TrackedLine[];
  rawUnits: IntakeUnitInput[];
  db: any;
}): Promise<{ units: PreparedUnit[] } | { error: string }> {
  const expectedCounts = new Map<string, number>();
  for (const line of opts.trackedLines) {
    expectedCounts.set(line.product.id, (expectedCounts.get(line.product.id) ?? 0) + line.quantity);
  }

  const units: PreparedUnit[] = [];
  const providedCounts = new Map<string, number>();
  const seenKeys = new Set<string>();

  for (const raw of opts.rawUnits) {
    const productId = String(raw.productId || "");
    if (!productId || !expectedCounts.has(productId)) {
      return { error: "Invalid unit row: product mismatch" };
    }

    providedCounts.set(productId, (providedCounts.get(productId) ?? 0) + 1);
  }

  for (const [productId, expected] of expectedCounts.entries()) {
    if ((providedCounts.get(productId) ?? 0) !== expected) {
      return { error: "Unit rows must match tracked quantities" };
    }
  }

  for (const raw of opts.rawUnits) {
    const line = opts.trackedLines.find((l) => l.product.id === raw.productId);
    if (!line) continue;

    const brand = (raw.brand ?? line.product.brand ?? "").trim();
    const model = (raw.model ?? line.product.model ?? "").trim();
    const manufacturerSerial = raw.manufacturerSerial?.trim() || null;
    let tagCode = raw.tagCode?.trim() || null;

    if (!manufacturerSerial && !tagCode) {
      tagCode = await generateTagCode(opts.db, getTagPrefix(line.product.type));
    }

    const validation = validateUnitData({
      ownershipType: "OWNED",
      productId: line.product.id,
      brand,
      model,
      manufacturerSerial,
      tagCode,
      productSerialRequired: line.product.serialRequired,
    });

    if (!validation.isValid) {
      return { error: validation.error ?? "Invalid unit data" };
    }

    const uniqueSerialKey = manufacturerSerial
      ? computeUniqueSerialKey(brand, model, manufacturerSerial)
      : tagCode;

    if (!uniqueSerialKey) {
      return { error: "Unique identifier required" };
    }

    if (seenKeys.has(uniqueSerialKey)) {
      return { error: "Duplicate serials/tags in intake" };
    }
    seenKeys.add(uniqueSerialKey);

    units.push({
      productId: line.product.id,
      brand,
      model,
      manufacturerSerial,
      tagCode,
      uniqueSerialKey,
    });
  }

  return { units };
}
