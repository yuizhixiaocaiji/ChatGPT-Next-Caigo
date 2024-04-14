import IconButton from "./button";
import styles from "./chat.module.scss";
import RenameIcon from "../icons/rename.svg";
import ExportIcon from "../icons/share.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import { useMobileScreen } from "../utils/utils";
import { useMemo } from "react";
import { getClientConfig } from "../config/client";

function _Chat() {
  const config = useAppConfig();
  const clientConfig = useMemo(() => getClientConfig(), []);
  const isMobileScreen = useMobileScreen();
  const showMaxIcon = !isMobileScreen && !clientConfig?.isApp;

  return (
    <div className={styles.chat}>
      <div className="window-header" data-tauri-drag-region>
        <div className={`window-header-title ${styles["chat-body-title"]}`}>
          <div
            className={`window-header-main-title ${styles["chat-body-main-title"]}`}
          >
            新的聊天
          </div>
          <div className="window-header-sub-title">共0条对话</div>
        </div>
        <div className="window-actions">
          <div className="window-action-button">
            <IconButton icon={<RenameIcon />} bordered />
          </div>
          <div className="window-action-button">
            <IconButton icon={<ExportIcon />} bordered />
          </div>
          {showMaxIcon && (
            <div className="window-action-button">
              <IconButton
                icon={config.tightBorder ? <MinIcon /> : <MaxIcon />}
                bordered
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Chat() {
  return <_Chat></_Chat>;
}
