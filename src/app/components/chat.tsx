import IconButton from "./button";
import styles from "./chat.module.scss";
import RenameIcon from "../icons/rename.svg";
import ExportIcon from "../icons/share.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import DeleteIcon from "../icons/clear.svg";
import SendWhiteIcon from "../icons/send-white.svg";
import { useMobileScreen } from "../utils/utils";
import { useMemo, useRef, useState } from "react";
import { getClientConfig } from "../config/client";
import { Theme, useAppConfig } from "../store/configs";
import { Prompt } from "../store/prompt";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chat";
import { ChatControllerPool } from "../client/controller";

export type RenderPrompt = Pick<Prompt, "title" | "content">;

export function DeleteImageButton(props: { deleteImage: () => void }) {
  return (
    <div className={styles["delete-image"]} onClick={props.deleteImage}>
      <DeleteIcon />
    </div>
  );
}

export function PromptHints(props: {
  prompts: RenderPrompt[];
  onPromptSelect: (prompt: RenderPrompt) => void;
}) {
  return <div>prompt</div>;
}

export function ChatActions(props: {
  uploadImage: () => void;
  setAttachImages: (images: string[]) => void;
  setUploading: (uploading: boolean) => void;
  showPromptModal: () => void;
  scrollToBottom: () => void;
  showPromptHints: () => void;
  hitBottom: boolean;
  uploading: boolean;
}) {
  const config = useAppConfig();
  const navigate = useNavigate();
  const chatStore = useChatStore();

  // switch themes
  const theme = config.theme;

  function nextTheme() {
    const themes = [Theme.Auto, Theme.Light, Theme.Dark];
    const themeIndex = themes.indexOf(theme);
    const nextIndex = (themeIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    config.update((config) => (config.theme = nextTheme));
  }
  // stop all responses
  const couldStop = ChatControllerPool.hasPending();
  const stopAll = () => ChatControllerPool.stopAll();

  const currentModel = chatStore.currentSession().mask.modelConfig.model;
  const allModels = useAllModels();
}

function _Chat() {
  const config = useAppConfig();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const clientConfig = useMemo(() => getClientConfig(), []);
  const isMobileScreen = useMobileScreen();
  const showMaxIcon = !isMobileScreen && !clientConfig?.isApp;

  const [attachImages, setAttachImages] = useState<string[]>([]);
  const [promptHints, setPromptHints] = useState<RenderPrompt[]>([]);

  const onPromptSelect = (prompt: RenderPrompt) => {
    setTimeout(() => {
      setPromptHints([]);
    }, 30);
  };

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

      <div className={styles["chat-input-panel"]}>
        <PromptHints prompts={promptHints} onPromptSelect={onPromptSelect} />

        <ChatActions
          uploadImage={uploadImage}
          setAttachImages={setAttachImages}
          setUploading={setUploading}
          showPromptModal={() => setShowPromptModal(true)}
          scrollToBottom={scrollToBottom}
          hitBottom={hitBottom}
          uploading={uploading}
          showPromptHints={() => {
            // Click again to close
            if (promptHints.length > 0) {
              setPromptHints([]);
              return;
            }

            inputRef.current?.focus();
            setUserInput("/");
            onSearch("");
          }}
        />
        <label
          className={`${styles["chat-input-panel-inner"]} ${
            attachImages.length != 0
              ? styles["chat-input-panel-inner-attach"]
              : ""
          }`}
          htmlFor="chat-input"
        >
          <textarea
            id="chat-input"
            ref={inputRef}
            className={styles["chat-input"]}
            placeholder={Locale.Chat.Input(submitKey)}
            onInput={(e) => onInput(e.currentTarget.value)}
            value={userInput}
            onKeyDown={onInputKeyDown}
            onFocus={scrollToBottom}
            onClick={scrollToBottom}
            onPaste={handlePaste}
            rows={inputRows}
            autoFocus={autoFocus}
            style={{
              fontSize: config.fontSize,
            }}
          />
          {attachImages.length != 0 && (
            <div className={styles["attach-images"]}>
              {attachImages.map((image, index) => {
                return (
                  <div
                    key={index}
                    className={styles["attach-image"]}
                    style={{ backgroundImage: `url("${image}")` }}
                  >
                    <div className={styles["attach-image-mask"]}>
                      <DeleteImageButton
                        deleteImage={() => {
                          setAttachImages(
                            attachImages.filter((_, i) => i !== index)
                          );
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <IconButton
            icon={<SendWhiteIcon />}
            text="发送"
            className={styles["chat-input-send"]}
            type="primary"
          />
        </label>
      </div>
    </div>
  );
}

export function Chat() {
  return <_Chat></_Chat>;
}
