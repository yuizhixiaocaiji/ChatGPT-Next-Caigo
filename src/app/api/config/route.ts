import { getServerSideConfigs } from "@/app/config/server";

const serverConfig = getServerSideConfigs();

// 警告！不要在这里写入任何敏感信息！
const DANGER_CONFIG = {
  needCode: serverConfig.needCode,
  hideUserApiKey: serverConfig.hideUserApiKey,
  disableGPT4: serverConfig.disableGPT4,
  hideBalanceQuery: serverConfig.hideBalanceQuery,
  disableFastLink: serverConfig.disableFastLink,
  customModels: serverConfig.customModels,
};

declare global {
  type DangerConfig = typeof DANGER_CONFIG;
}
