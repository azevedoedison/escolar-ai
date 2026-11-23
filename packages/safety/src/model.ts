// Contrato do cliente de modelo usado pelos classificadores (M-22, M-23).
// O pacote só conhece esta interface: nos testes entra um dublê; o cliente real
// (provedor e chave por variável de ambiente) é ligado junto da rota de chat (M-12).

export interface ModelRequest {
  system: string;
  user: string;
  maxTokens: number;
}

export interface ModelClient {
  /** Identificador do modelo, gravado no safety_event. */
  model?: string;
  complete(req: ModelRequest): Promise<string>;
}
