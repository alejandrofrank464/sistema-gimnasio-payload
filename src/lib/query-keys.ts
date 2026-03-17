export const queryKeys = {
  clients: ['clients'] as const,
  payments: ['payments'] as const,
  paymentsFiltered: (params: { month?: number; year?: number; limit?: number }) =>
    [
      'payments',
      'filtered',
      params.month ?? 'all',
      params.year ?? 'all',
      params.limit ?? 500,
    ] as const,
  paymentsList: (params: { page: number; limit: number; month?: number; year?: number }) =>
    [
      'payments',
      'list',
      params.page,
      params.limit,
      params.month ?? 'all',
      params.year ?? 'all',
    ] as const,
  logs: ['logs'] as const,
  logsList: (params: { page: number; limit: number; search?: string }) =>
    ['logs', 'list', params.page, params.limit, params.search ?? ''] as const,
  settings: ['settings'] as const,
  schedule: (month: number, year: number) => ['schedule', month, year] as const,
  clientPaymentsAll: ['client-payments'] as const,
  clientPayments: (clientId: string) => ['client-payments', clientId] as const,
  clientPaymentsInfinite: (clientId: string, pageSize: number) =>
    ['client-payments', clientId, 'infinite', pageSize] as const,
}
