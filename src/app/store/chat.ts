import { nanoid } from "nanoid";
import { createPersistStore } from "../utils/store";
import { RequestMessage } from "../client/api";
import { ModelConfig, ModelType, useAppConfig } from "./configs";
import { Mask, createEmptyMask } from "./mask";
import Locale, { getLang } from "../locales";
import { showToast } from "../components/ui-lib";
import { DEFAULT_INPUT_TEMPLATE, DEFAULT_MODELS, KnowledgeCutOffDate, StoreKey } from "../constant";
export type ChatMessage = RequestMessage & {
  date: string;
  streaming?: boolean;
  isError?: boolean;
  id: string;
  model?: ModelType;
};

export interface ChatStat {
  tokenCount: number;
  wordCount: number;
  charCount: number;
}

export interface ChatSession {
  id: string;
  topic: string;

  memoryPrompt: string;
  messages: ChatMessage[];
  stat: ChatStat;
  lastUpdate: number;
  lastSummarizeIndex: number;
  clearContextIndex?: number;

  mask: Mask;
}

export const DEFAULT_TOPIC = Locale.Store.DefaultTopic;
function createEmptySession(): ChatSession {
  return {
    id: nanoid(),
    topic: DEFAULT_TOPIC,
    memoryPrompt: "",
    messages: [],
    stat: {
      tokenCount: 0,
      wordCount: 0,
      charCount: 0,
    },
    lastUpdate: Date.now(),
    lastSummarizeIndex: 0,

    mask: createEmptyMask(),
  };
}

const DEFAULT_CHAT_STATE = {
  sessions: [createEmptySession()],
  currentSessionIndex: 0,
};

export function createMessage(override: Partial<ChatMessage>): ChatMessage {
  return {
    id: nanoid(),
    date: new Date().toLocaleString(),
    role: "user",
    content: "",
    ...override,
  };
}

function fillTemplateWith(input: string, modelConfig: ModelConfig) {
  const cutoff =
    KnowledgeCutOffDate[modelConfig.model] ?? KnowledgeCutOffDate.default;
  // Find the model in the DEFAULT_MODELS array that matches the modelConfig.model
  const modelInfo = DEFAULT_MODELS.find((m) => m.name === modelConfig.model);

  var serviceProvider = "OpenAI";
  if (modelInfo) {
    // TODO: auto detect the providerName from the modelConfig.model

    // Directly use the providerName from the modelInfo
    serviceProvider = modelInfo.provider.providerName;
  }

  const vars = {
    ServiceProvider: serviceProvider,
    cutoff,
    model: modelConfig.model,
    time: new Date().toLocaleString(),
    lang: getLang(),
    input: input,
  };

  let output = modelConfig.template ?? DEFAULT_INPUT_TEMPLATE;

  // remove duplicate
  if (input.startsWith(output)) {
    output = "";
  }

  // must contains {{input}}
  const inputVar = "{{input}}";
  if (!output.includes(inputVar)) {
    output += "\n" + inputVar;
  }

  Object.entries(vars).forEach(([name, value]) => {
    const regex = new RegExp(`{{${name}}}`, "g");
    output = output.replace(regex, value.toString()); // Ensure value is a string
  });

  return output;
}

export const useChatStore = createPersistStore(
  DEFAULT_CHAT_STATE,
  (set, get) => ({
    clearSessions() {
      set(() => ({
        sessions: [createEmptySession()],
        currentSessionIndex: 0,
      }));
    },

    selectSession(index: number) {
      set({
        currentSessionIndex: index,
      });
    },

    nextSession(delta: number) {
      const n = get().sessions.length;
      const limit = (x: number) => (x + n) % n;
      const i = get().currentSessionIndex;
      this.selectSession(limit(i + delta));
    },

    moveSession(from: number, to: number) {
      set((state) => {
        const { sessions, currentSessionIndex: oldIndex } = state;

        // move the session
        const newSessions = [...sessions];
        const session = newSessions[from];
        newSessions.splice(from, 1);
        newSessions.splice(to, 0, session);

        // modify current session id
        let newIndex = oldIndex === from ? to : oldIndex;
        if (oldIndex > from && oldIndex <= to) {
          newIndex -= 1;
        } else if (oldIndex < from && oldIndex >= to) {
          newIndex += 1;
        }

        return {
          currentSessionIndex: newIndex,
          sessions: newSessions,
        };
      });
    },

    currentSession() {
      let index = get().currentSessionIndex;
      const sessions = get().sessions;

      // 确保index在范围内
      if (index < 0 || index >= sessions.length) {
        index = Math.min(sessions.length - 1, Math.max(0, index));
        set(() => ({ currentSessionIndex: index }));
      }

      const session = sessions[index];

      return session;
    },

    async onUserInput(content: string, attachImages?: string[]) {
      const session = this.currentSession();
      const modelConfig = session.mask.modelConfig;
      const userContent = fillTemplateWith(content, modelConfig);
    },

    newSession(mask?: Mask) {
      const session = createEmptySession();

      if (mask) {
        const config = useAppConfig.getState();
        const globalModelConfig = config.modelConfig;

        session.mask = {
          ...mask,
          modelConfig: {
            ...globalModelConfig,
            ...mask.modelConfig,
          },
        };
        session.topic = mask.name;
      }

      set((state) => ({
        currentSessionIndex: 0,
        sessions: [session].concat(state.sessions),
      }));
    },

    deleteSession(index: number) {
      const deletingLastSession = get().sessions.length === 1;
      const deletedSession = get().sessions.at(index);

      if (!deletedSession) return;

      const sessions = get().sessions.slice();
      sessions.splice(index, 1);

      const currentIndex = get().currentSessionIndex;
      let nextIndex = Math.min(
        currentIndex - Number(index < currentIndex),
        sessions.length - 1
      );

      if (deletingLastSession) {
        nextIndex = 0;
        sessions.push(createEmptySession());
      }

      // for undo delete action
      const restoreState = {
        currentSessionIndex: get().currentSessionIndex,
        sessions: get().sessions.slice(),
      };

      set(() => ({
        currentSessionIndex: nextIndex,
        sessions,
      }));

      showToast(
        Locale.Home.DeleteToast,
        {
          text: Locale.Home.Revert,
          onClick() {
            set(() => restoreState);
          },
        },
        5000
      );
    },

    updateCurrentSession(updater: (session: ChatSession) => void) {
      const sessions = get().sessions;
      const index = get().currentSessionIndex;
      updater(sessions[index]);
      set(() => ({ sessions }));
    },
  }),
  {
    name: StoreKey.Chat,
    version: 1.0,
    migrate(persistedState, version) {
      const state = persistedState as any;
      const newState = JSON.parse(
        JSON.stringify(state)
      ) as typeof DEFAULT_CHAT_STATE;

      if (version < 2) {
        newState.sessions = [];

        const oldSessions = state.sessions;
        for (const oldSession of oldSessions) {
          const newSession = createEmptySession();
          newSession.topic = oldSession.topic;
          newSession.messages = [...oldSession.messages];
          newSession.mask.modelConfig.sendMemory = true;
          newSession.mask.modelConfig.historyMessageCount = 4;
          newSession.mask.modelConfig.compressMessageLengthThreshold = 1000;
          newState.sessions.push(newSession);
        }
      }
      return newState as any;
    },
  }
);
