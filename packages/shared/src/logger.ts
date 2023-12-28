import pino from "pino";

const Logger = (name: string) => {
  const level = process.env.LOG_LEVEL ?? "debug";

  return pino({
    name,
    level,
  });
};

export default Logger;
