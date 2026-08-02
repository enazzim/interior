export const MOCK_COMMON_CODES = [
  { codeId: 1, codeGroup: 'EST_EXTRA_COST_TYPE', codeKey: 'DEMOLITION', codeValue: '철거비', sortOrder: 1, isSystem: true },
  { codeId: 2, codeGroup: 'EST_EXTRA_COST_TYPE', codeKey: 'TRANSPORT', codeValue: '운반비', sortOrder: 2, isSystem: true },
  { codeId: 3, codeGroup: 'EST_EXTRA_COST_TYPE', codeKey: 'PROTECTION', codeValue: '보양비', sortOrder: 3, isSystem: true },
  { codeId: 4, codeGroup: 'EST_EXTRA_COST_TYPE', codeKey: 'FACILITY', codeValue: '폐기물 처리비', sortOrder: 4, isSystem: true },
  { codeId: 5, codeGroup: 'EST_EXTRA_COST_TYPE', codeKey: 'OVERHEAD', codeValue: '기업이윤/기타경비', sortOrder: 5, isSystem: true },
];

export const MOCK_ESTIMATE_RESPONSE = {
  estimateId: 101,
  projectId: 1,
  projectName: '강남 레미안 34평 인테리어',
  totalAmount: 15500000,
  vat: 1550000,
  marginRate: 20.0,
  items: [],
  extraCosts: [
    { categoryKey: 'DEMOLITION', categoryValue: '철거비', amount: 1500000 },
    { categoryKey: 'TRANSPORT', categoryValue: '운반비', amount: 300000 },
  ],
};
