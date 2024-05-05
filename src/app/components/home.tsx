"use client";

require("../polyfill");
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import styles from "./home.module.scss";
import { Path } from "../constant";
import { SideBar } from "./sideBar";
import dynamic from "next/dynamic";
import BotIcon from "../icons/bot.svg";
import LoadingIcon from "../icons/three-dots.svg";
import { getClientConfig } from "../config/client";
import { useEffect } from "react";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

const Chat = dynamic(async () => (await import("./chat")).Chat, {
  loading: () => <Loading noLogo />,
});

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement("link");
  const proxyFontUrl = "/google-fonts";
  const remoteFontUrl = "https://fonts.googleapis.com";
  const googleFontUrl =
    getClientConfig()?.buildMode === "export" ? remoteFontUrl : proxyFontUrl;
  linkEl.rel = "stylesheet";
  linkEl.href =
    googleFontUrl +
    "/css2?family=" +
    encodeURIComponent("Noto Sans:wght@300;400;700;900") +
    "&display=swap";
  document.head.appendChild(linkEl);
};

function Screen() {
  const isHome = location.pathname === Path.Home;

  useEffect(() => {
    loadAsyncGoogleFont();
  }, []);
  return (
    <div className={styles.container}>
      <>
        <SideBar className={isHome ? styles["sidebar-show"] : ""} />

        <div className={styles["window-content"]}>
          <Routes>
            <Route path={Path.Home} element={<Chat />} />
            <Route path={Path.Chat} element={<Chat />} />
            {/* <Route path={Path.NewChat} element={<NewChat />} /> */}
            {/* <Route path={Path.Masks} element={<MaskPage />} />
            <Route path={Path.Settings} element={<Settings />} /> */}
          </Routes>
        </div>
      </>
    </div>
  );
}

export function Home() {
  return (
    <Router>
      <Screen />
    </Router>
  );
}
