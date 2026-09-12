export class BadGatewayError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(
      message ??
        'Um serviço externo não respondeu. Tente novamente mais tarde.',
      options
    )
  }
}
