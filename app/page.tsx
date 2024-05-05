import { Analytics } from "@vercel/analytics/react";
import { getServerSideConfigs } from "./config/server";
import { Home } from "./components/home";

const serverConfig = getServerSideConfigs();

export default async function App() {
  return (
    <>
      <Home />
      {serverConfig?.isVercel && (
        <>
          <Analytics />
        </>
      )}
    </>
  );
}
