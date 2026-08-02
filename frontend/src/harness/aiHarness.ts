export interface AiEstimatePayload {
  projectId?: number;
  marginRate?: number;
  items?: Array<{
    materialId: number;
    inputArea: number;
  }>;
}

/**
 * Frontend Guardrail for AI Recommendation payloads.
 * Prevents UI crashes from missing fields or invalid numeric inputs.
 */
export function sanitizeAiEstimatePayload(payload: Partial<AiEstimatePayload>): AiEstimatePayload {
  const safeMarginRate = typeof payload.marginRate === 'number' && payload.marginRate >= 0 && payload.marginRate <= 50
    ? payload.marginRate
    : 20;

  const safeItems = Array.isArray(payload.items)
    ? payload.items.map((item) => ({
        materialId: typeof item.materialId === 'number' ? item.materialId : 1,
        inputArea: typeof item.inputArea === 'number' && item.inputArea >= 0 ? item.inputArea : 0,
      }))
    : [];

  return {
    projectId: payload.projectId || 1,
    marginRate: safeMarginRate,
    items: safeItems,
  };
}
