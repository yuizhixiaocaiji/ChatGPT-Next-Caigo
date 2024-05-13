import React, { useEffect, useRef } from "react";
import styles from "./home.module.scss";
import ChatGptIcon from "../icons/chatgpt.svg";
import IconButton from "./button";
import MaskIcon from "../icons/mask.svg";
import AddIcon from "../icons/add.svg";
import {
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  DEFAULT_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
  REPO_URL,
} from "../constant";
import { Link, useNavigate } from "react-router-dom";
import SettingsIcon from "../icons/settings.svg";
import GithubIcon from "../icons/github.svg";
import { useAppConfig } from "../store";
import { useMobileScreen } from "../utils/utils";
import dynamic from "next/dynamic";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

function useDragSideBar() {
  const limit = (x: number) => Math.min(MAX_SIDEBAR_WIDTH, x);

  const config = useAppConfig();
  const startX = useRef(0);
  const startDragWidth = useRef(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
  const lastUpdateTime = useRef(Date.now());

  const toggleSideBar = () => {
    config.update((config) => {
      if (config.sidebarWidth < MIN_SIDEBAR_WIDTH) {
        config.sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
      } else {
        config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
      }
    });
  };

  const onDragStart = (e: MouseEvent) => {
    // Remembers the initial width each time the mouse is pressed
    startX.current = e.clientX;
    startDragWidth.current = config.sidebarWidth;
    const dragStartTime = Date.now();

    const handleDragMove = (e: MouseEvent) => {
      if (Date.now() < lastUpdateTime.current + 20) {
        return;
      }
      lastUpdateTime.current = Date.now();
      const d = e.clientX - startX.current;
      const nextWidth = limit(startDragWidth.current + d);
      config.update((config) => {
        if (nextWidth < MIN_SIDEBAR_WIDTH) {
          config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
        } else {
          config.sidebarWidth = nextWidth;
        }
      });
    };

    const handleDragEnd = () => {
      // In useRef the data is non-responsive, so `config.sidebarWidth` can't get the dynamic sidebarWidth
      window.removeEventListener("pointermove", handleDragMove);
      window.removeEventListener("pointerup", handleDragEnd);

      // if user click the drag icon, should toggle the sidebar
      const shouldFireClick = Date.now() - dragStartTime < 300;
      if (shouldFireClick) {
        toggleSideBar();
      }
    };

    window.addEventListener("pointermove", handleDragMove);
    window.addEventListener("pointerup", handleDragEnd);
  };

  const isMobileScreen = useMobileScreen();
  const shouldNarrow =
    !isMobileScreen && config.sidebarWidth < MIN_SIDEBAR_WIDTH;

  useEffect(() => {
    const barWidth = shouldNarrow
      ? NARROW_SIDEBAR_WIDTH
      : limit(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
    const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;
    document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
  }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

  return {
    onDragStart,
    shouldNarrow,
  };
}

export function SideBar(props: { className?: string }) {
  const { onDragStart, shouldNarrow } = useDragSideBar();
  const navigate = useNavigate();

  return (
    <div className={`${styles.sidebar} ${props.className}`}>
      <div className={styles["sidebar-header"]} data-tauri-drag-region>
        <div className={styles["sidebar-title"]} data-tauri-drag-region>
          菜狗GPT
        </div>
        <div className={styles["sidebar-sub-title"]}>
          迎面走来的你让我如此蠢蠢欲动~
        </div>
        <div className={styles["sidebar-logo"] + " no-dark"}>
          <ChatGptIcon />
        </div>
      </div>

      <div className={styles["sidebar-header-bar"]}>
        <IconButton
          icon={<AddIcon />}
          text="新的聊天"
          className={styles["sidebar-bar-button"]}
          onClick={() => navigate(Path.NewChat)}
          shadow
        />
      </div>

      <div className={styles["sidebar-body"]}>
        <ChatList narrow={shouldNarrow} />
      </div>

      <div className={styles["sidebar-tail"]}>
        <div className={styles["sidebar-actions"]}>
          <div className={styles["sidebar-action"]}>
            <Link to={Path.Auth}>
              <IconButton icon={<SettingsIcon />} shadow />
            </Link>
          </div>
          <div className={styles["sidebar-action"]}>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              <IconButton icon={<GithubIcon />} shadow />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
