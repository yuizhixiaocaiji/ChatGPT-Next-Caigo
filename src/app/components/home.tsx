"use client";

import { HashRouter as Router } from "react-router-dom";

function Screen() {
  return <div>Hello</div>;
}

export function Home() {
  return (
    <Router>
      <Screen />
    </Router>
  );
}
