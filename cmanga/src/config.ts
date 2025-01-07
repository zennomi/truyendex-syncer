import z from "zod";
import { parseEnv } from "znv";
import { configDotenv } from "dotenv";

configDotenv();

const createConfigFromEnvironment = (environment: NodeJS.ProcessEnv) => {
  const config = parseEnv(environment, {
    MONGO_DATABASE: z.string(),
    MONGO_USERNAME: z.string(),
    MONGO_PASSWORD: z.string(),
    MONGO_HOST: z.string().default("127.0.0.1"),
    MONGO_PORT: z.number(),
    PROXY_BACKEND_URL: z.string().default("http://localhost:3000"),
  });

  return {
    ...config,
  };
};

export type Config = ReturnType<typeof createConfigFromEnvironment>;

const config = createConfigFromEnvironment(process.env);

export default config;
