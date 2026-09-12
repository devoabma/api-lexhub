export class ConflictError extends Error {
  constructor(message?: string) {
    super(message ?? 'A operação conflita com o estado atual do registro.')
  }
}
