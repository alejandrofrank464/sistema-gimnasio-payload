export const queryKeys = {
  clients: ['clients'] as const,
  clientsList: (params: { page: number; limit: number; search?: string }) =>
    ['clients', 'list', params.page, params.limit, params.search ?? ''] as const,
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
  logsList: (params: {
    page: number
    limit: number
    search?: string
    entity?: 'all' | 'Cliente' | 'Pago' | 'Ajuste'
    action?: 'all' | 'Crear' | 'Editar' | 'Eliminar'
    sortDate?: 'asc' | 'desc'
  }) =>
    [
      'logs',
      'list',
      params.page,
      params.limit,
      params.search ?? '',
      params.entity ?? 'all',
      params.action ?? 'all',
      params.sortDate ?? 'desc',
    ] as const,
  settings: ['settings'] as const,
  schedule: (month: number, year: number) => ['schedule', month, year] as const,
  clientPaymentsAll: ['client-payments'] as const,
  clientPayments: (clientId: string) => ['client-payments', clientId] as const,
  clientPaymentsInfinite: (clientId: string, pageSize: number) =>
    ['client-payments', clientId, 'infinite', pageSize] as const,
}
