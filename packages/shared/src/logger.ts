import pino from "pino";

const Logger = (name: string) => {
  const level = process.env.LOG_LEVEL ?? "debug";
  const environment = process.env.NODE_ENV ?? "development";

  if (environment === "production") {
    // Production logging with Pino
    return pino({
      name,
      level,
    });
  } else {
    // Development logging with console
    return {
      trace: console.trace,
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
      fatal: console.error,
      name,
      level,
    } as unknown as pino.Logger; //force cast to pino.Logger only for development
  }
};

export default Logger;
