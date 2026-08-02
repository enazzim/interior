/**
 * Global Frontend Harness: Universal Data Sanitizer for API responses.
 * Prevents UI components from throwing NPEs or undefined errors.
 */

export interface ExpensePayload {
  expenseId?: number;
  amount?: number;
  processName?: string;
  vendorName?: string;
}

export interface MaterialPayload {
  materialId?: number;
  materialName?: string;
  purchasePrice?: number;
  laborPrice?: number;
  conversionRate?: number;
}

export function sanitizeExpensePayload(data: Partial<ExpensePayload>): ExpensePayload {
  return {
    expenseId: data.expenseId || 0,
    amount: typeof data.amount === 'number' && data.amount >= 0 ? data.amount : 0,
    processName: data.processName || '기본 공정',
    vendorName: data.vendorName || '기본 거래처',
  };
}

export function sanitizeMaterialPayload(data: Partial<MaterialPayload>): MaterialPayload {
  return {
    materialId: data.materialId || 0,
    materialName: data.materialName || '미지정 자재',
    purchasePrice: typeof data.purchasePrice === 'number' && data.purchasePrice >= 0 ? data.purchasePrice : 0,
    laborPrice: typeof data.laborPrice === 'number' && data.laborPrice >= 0 ? data.laborPrice : 0,
    conversionRate: typeof data.conversionRate === 'number' && data.conversionRate > 0 ? data.conversionRate : 1.0,
  };
}
