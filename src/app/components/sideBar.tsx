import React from "react";
import styles from "./home.module.scss";
import ChatGptIcon from "../icons/chatgpt.svg";

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
    </div>
  );
}
