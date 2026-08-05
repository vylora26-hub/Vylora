// ============================================================
// IREPOSITORY — Contrato base para todos los repositorios
// Principio: dependency inversion — el servicio depende de
// la interfaz, no de la implementación concreta de Supabase.
// ============================================================

export interface IRepository<T, CreatePayload, UpdatePayload> {
  findById(id: string): Promise<T | null>
  create(payload: CreatePayload): Promise<T>
  update(id: string, payload: UpdatePayload): Promise<T>
  delete(id: string): Promise<void>
}

/** Respuesta paginada estándar */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  hasMore: boolean
  cursor: string | null
}

/** Error tipado de repositorio */
export class RepositoryError extends Error {
  readonly code?: string
  readonly details?: unknown

  constructor(message: string, code?: string, details?: unknown) {
    super(message)
    this.name = 'RepositoryError'
    this.code = code
    this.details = details
  }
}
