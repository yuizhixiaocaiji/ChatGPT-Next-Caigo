import { nanoid } from "nanoid";
import { Lang, getLang } from "../locales";
import { ChatMessage, DEFAULT_TOPIC } from "./chat";
import { ModelConfig, useAppConfig } from "./configs";
import { createPersistStore } from "../utils/store";
import { StoreKey } from "../constant";
import { BUILTIN_MASKS } from "../masks";

export const DEFAULT_MASK_AVATAR = "gpt-bot";
export type Mask = {
  id: string;
  createdAt: number;
  avatar: string;
  name: string;
  hideContext?: boolean;
  context: ChatMessage[];
  syncGlobalConfig?: boolean;
  modelConfig: ModelConfig;
  lang: Lang;
  builtin: boolean;
};

export const DEFAULT_MASK_STATE = {
  masks: {} as Record<string, Mask>,
};

export type MaskState = typeof DEFAULT_MASK_STATE;

export const createEmptyMask = () =>
  ({
    id: nanoid(),
    avatar: DEFAULT_MASK_AVATAR,
    name: DEFAULT_TOPIC,
    context: [],
    syncGlobalConfig: true, // use global config as default
    modelConfig: { ...useAppConfig.getState().modelConfig },
    lang: getLang(),
    builtin: false,
    createdAt: Date.now(),
  }) as Mask;

export const maskStore = createPersistStore(
  { ...DEFAULT_MASK_STATE },
  (set, get) => ({
    getAll() {
      const userMasks = Object.values(get().masks).sort(
        (a, b) => b.createdAt - a.createdAt
      );
      const config = useAppConfig.getState();
      if (config.hideBuiltinMasks) return userMasks;
      const buildinMasks = BUILTIN_MASKS.map(
        (m) =>
          ({
            ...m,
            modelConfig: {
              ...config.modelConfig,
              ...m.modelConfig,
            },
          }) as Mask
      );
      return userMasks.concat(buildinMasks);
    },
  }),
  {
    name: StoreKey.Mask,
    version: 1.0,
    migrate(state, version) {
      const newState = JSON.parse(JSON.stringify(state)) as MaskState;

      return newState as any;
    },
  }
);
