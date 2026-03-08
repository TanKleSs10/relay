import env from "env-var";

export const envs = {
  URL_DB: env.get("DB_URL_WORKER").required().asString(),
};
