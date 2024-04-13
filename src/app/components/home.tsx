"use client";

import { HashRouter as Router } from "react-router-dom";
import styles from "./home.module.scss";
import { Path } from "../constant";
import { SideBar } from "./sideBar";
function Screen() {
  const isHome = location.pathname === Path.Home;

  return (
    <div className={styles.container}>
      <>
        <SideBar className={isHome ? styles["sidebar-show"] : ""} />
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
