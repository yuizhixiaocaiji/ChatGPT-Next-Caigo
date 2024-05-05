import { nanoid } from "nanoid";
import { createPersistStore } from "../utils/store";
import { MultimodalContent, RequestMessage } from "../client/api";
import { ModelConfig, ModelType, useAppConfig } from "./configs";
import { Mask, createEmptyMask } from "./mask";
import Locale, { getLang } from "../locales";
import { showToast } from "../components/ui-lib";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_MODELS,
  DEFAULT_SYSTEM_TEMPLATE,
  KnowledgeCutOffDate,
  StoreKey,
} from "../constant";
import { estimateTokenLength } from "../utils/token";
import { getMessageTextContent } from "../utils/utils";
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
export const BOT_HELLO: ChatMessage = createMessage({
  role: "assistant",
  content: Locale.Store.BotHello,
});
function createEmptySession(): ChatSession {
  console.log("开始创建全新的会话");
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

    getMemoryPrompt() {
      const session = this.currentSession();

      return {
        role: "system",
        content:
          session.memoryPrompt.length > 0
            ? Locale.Store.Prompt.History(session.memoryPrompt)
            : "",
        date: "",
      } as ChatMessage;
    },

    getMessagesWithMemory() {
      const session = this.currentSession();
      const modelConfig = session.mask.modelConfig;
      const clearContextIndex = session.clearContextIndex ?? 0;
      const messages = session.messages.slice();
      const totalMessageCount = session.messages.length;

      // in-context prompts
      const contextPrompts = session.mask.context.slice();

      // system prompts, to get close to OpenAI Web ChatGPT
      const shouldInjectSystemPrompts =
        modelConfig.enableInjectSystemPrompts &&
        session.mask.modelConfig.model.startsWith("gpt-");

      var systemPrompts: ChatMessage[] = [];
      systemPrompts = shouldInjectSystemPrompts
        ? [
            createMessage({
              role: "system",
              content: fillTemplateWith("", {
                ...modelConfig,
                template: DEFAULT_SYSTEM_TEMPLATE,
              }),
            }),
          ]
        : [];
      if (shouldInjectSystemPrompts) {
        console.log(
          "[Global System Prompt] ",
          systemPrompts.at(0)?.content ?? "empty"
        );
      }

      // long term memory
      const shouldSendLongTermMemory =
        modelConfig.sendMemory &&
        session.memoryPrompt &&
        session.memoryPrompt.length > 0 &&
        session.lastSummarizeIndex > clearContextIndex;
      const longTermMemoryPrompts = shouldSendLongTermMemory
        ? [this.getMemoryPrompt()]
        : [];
      const longTermMemoryStartIndex = session.lastSummarizeIndex;

      // short term memory
      const shortTermMemoryStartIndex = Math.max(
        0,
        totalMessageCount - modelConfig.historyMessageCount
      );

      // lets concat send messages, including 4 parts:
      // 0. system prompt: to get close to OpenAI Web ChatGPT
      // 1. long term memory: summarized memory messages
      // 2. pre-defined in-context prompts
      // 3. short term memory: latest n messages
      // 4. newest input message
      const memoryStartIndex = shouldSendLongTermMemory
        ? Math.min(longTermMemoryStartIndex, shortTermMemoryStartIndex)
        : shortTermMemoryStartIndex;
      // and if user has cleared history messages, we should exclude the memory too.
      const contextStartIndex = Math.max(clearContextIndex, memoryStartIndex);
      const maxTokenThreshold = modelConfig.max_tokens;

      // get recent messages as much as possible
      const reversedRecentMessages = [];
      for (
        let i = totalMessageCount - 1, tokenCount = 0;
        i >= contextStartIndex && tokenCount < maxTokenThreshold;
        i -= 1
      ) {
        const msg = messages[i];
        if (!msg || msg.isError) continue;
        tokenCount += estimateTokenLength(getMessageTextContent(msg));
        reversedRecentMessages.push(msg);
      }
      // concat all messages
      const recentMessages = [
        ...systemPrompts,
        ...longTermMemoryPrompts,
        ...contextPrompts,
        ...reversedRecentMessages.reverse(),
      ];

      return recentMessages;
    },

    async onUserInput(content: string, attachImages?: string[]) {
      const session = this.currentSession();
      const modelConfig = session.mask.modelConfig;
      const userContent = fillTemplateWith(content, modelConfig);
      console.log("[User Input] after template: ", userContent);

      let mContent: string | MultimodalContent[] = userContent;

      if (attachImages && attachImages.length > 0) {
        mContent = [
          {
            type: "text",
            text: userContent,
          },
        ];
        mContent = mContent.concat(
          attachImages.map((url) => {
            return {
              type: "image_url",
              image_url: {
                url: url,
              },
            };
          })
        );
      }
      let userMessage: ChatMessage = createMessage({
        role: "user",
        content: mContent,
      });

      const botMessage: ChatMessage = createMessage({
        role: "assistant",
        streaming: true,
        model: modelConfig.model,
      });

      // 获取最新消息
      const recentMessages = this.getMessagesWithMemory();
      const sendMessages = recentMessages.concat(userMessage);
      const messageIndex = this.currentSession().messages.length + 1;

      // 保存用戶和机器人的消息
      this.updateCurrentSession((session) => {
        const savedUserMessage = {
          ...userMessage,
          content: mContent,
        };
        session.messages = session.messages.concat([
          savedUserMessage,
          botMessage,
        ]);
      });
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
