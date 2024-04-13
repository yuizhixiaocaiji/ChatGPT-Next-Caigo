"use client";

import { HashRouter as Router } from "react-router-dom";
import styles from "./home.module.scss";
function Screen() {
  return <div className={styles.container}>hello</div>;
}

export function Home() {
  return (
    <Router>
      <Screen />
    </Router>
  );
}
