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
    ELASTICSEARCH_NODE: z.string().default("http://localhost:9200"),
    ELASTICSEARCH_USERNAME: z.string().default("elastic"),
    ELASTICSEARCH_PASSWORD: z.string().default("changeme"),

    DIRECTUS_URL: z.string(),
    DIRECTUS_ADMIN_EMAIL: z.string(),
    DIRECTUS_ADMIN_PASSWORD: z.string(),

    PRODUCTION_DIRECTUS_URL: z.string(),
    PRODUCTION_DIRECTUS_ADMIN_EMAIL: z.string(),
    PRODUCTION_DIRECTUS_ADMIN_PASSWORD: z.string(),

    DB_USER: z.string(),
    DB_HOST: z.string(),
    DB_DATABASE: z.string(),
    DB_PASSWORD: z.string(),
    DB_PORT: z.number(),

    ROTATING_PROXY_URL: z.string(),
  });

  return {
    ...config,
  };
};

export type Config = ReturnType<typeof createConfigFromEnvironment>;

const config = createConfigFromEnvironment(process.env);

export default config;
