import { useMemo } from "react";
import { useAppConfig } from "../store/configs";
import { collectModels } from "./model";

export function useAllModels() {
  const accessStore = useAccessStore();
  const configStore = useAppConfig();
  const models = useMemo(() => {
    return collectModels(
      configStore.models,
      [configStore.customModels, accessStore.customModels].join(",")
    );
  }, [accessStore.customModels, configStore.customModels, configStore.models]);

  return models;
}
