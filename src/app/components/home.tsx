"use client";

import { HashRouter as Router, Routes, Route } from "react-router-dom";
import styles from "./home.module.scss";
import { Path } from "../constant";
import { SideBar } from "./sideBar";
import dynamic from "next/dynamic";
import BotIcon from "../icons/bot.svg";
import LoadingIcon from "../icons/three-dots.svg";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

function Screen() {
  const isHome = location.pathname === Path.Home;

  return (
    <div className={styles.container}>
      <>
        <SideBar className={isHome ? styles["sidebar-show"] : ""} />

        <div className={styles["window-content"]} id={SlotID.AppBody}>
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
