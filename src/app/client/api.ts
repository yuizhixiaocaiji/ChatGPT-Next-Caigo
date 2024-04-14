export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];
export interface LLMModelProvider {
  id: string;
  providerName: string;
  providerType: string;
}

export interface MultimodalContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface LLMModel {
  name: string;
  available: boolean;
  provider: LLMModelProvider;
}

export interface RequestMessage {
  role: MessageRole;
  content: string | MultimodalContent[];
}
