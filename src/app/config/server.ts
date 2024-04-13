export const getServerSideConfigs = () => {
  if (typeof process === "undefined") {
    throw Error(
      "[Server Config Error] you are importing a nodejs-only module outside of nodejs"
    );
  }

  const isVercel = !!process.env.VERCEL;

  return {
    isVercel,
  };
};
