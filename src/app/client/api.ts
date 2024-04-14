export interface LLMModelProvider {
  id: string;
  providerName: string;
  providerType: string;
}

export interface LLMModel {
  name: string;
  available: boolean;
  provider: LLMModelProvider;
}
