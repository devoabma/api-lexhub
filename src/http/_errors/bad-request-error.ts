export class BadRequestError extends Error {
  constructor(message?: string) {
    super(message ?? 'Requisição inválida, verifique os dados enviados.')
  }
}
