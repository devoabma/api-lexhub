export class UnprocessableEntityError extends Error {
  constructor(message?: string) {
    super(
      message ?? 'Não foi possível processar a solicitação. Tente novamente.'
    )
  }
}
