import React from "react";
import styles from "./home.module.scss";
import ChatGptIcon from "../icons/chatgpt.svg";
import IconButton from "./button";
import MaskIcon from "../icons/mask.svg";
import AddIcon from "../icons/add.svg";
import { Path, REPO_URL } from "../constant";
import { Link } from "react-router-dom";
import SettingsIcon from "../icons/settings.svg";
import GithubIcon from "../icons/github.svg";

export function SideBar(props: { className?: string }) {
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
          icon={<MaskIcon />}
          text="来点思路"
          className={styles["sidebar-bar-button"]}
          shadow
        />
        <IconButton
          icon={<AddIcon />}
          text="新的聊天"
          className={styles["sidebar-bar-button"]}
          shadow
        />
      </div>

      <div className={styles["sidebar-body"]}>
        
      </div>

      <div className={styles["sidebar-tail"]}>
        <div className={styles["sidebar-actions"]}>
          <div className={styles["sidebar-action"]}>
            <Link to={Path.Settings}>
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
