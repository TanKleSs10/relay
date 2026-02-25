import env from "env-var";

export const envs = {
  URL_DB: env.get("DB_URL_WORKER").default("postgresql://admin:admin123@localhost:5432/relay_db").asString(),
};
