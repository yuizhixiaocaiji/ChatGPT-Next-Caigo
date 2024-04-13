import { Analytics } from "@vercel/analytics/react";
import { getServerSideConfigs } from "./config/server";

const serverConfig = getServerSideConfigs();

export default async function App() {
  return (
    <>
      {serverConfig?.isVercel && (
        <>
          <Analytics />
        </>
      )}
    </>
  );
}
