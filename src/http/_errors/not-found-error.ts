export class NotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Registro não encontrado. Verifique os dados informados.')
  }
}
