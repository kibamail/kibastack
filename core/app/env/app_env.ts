import { url, cleanEnv, host, port, str } from 'envalid'

import { makeEnvSecrets } from '#root/core/shared/utils/env/make_env_secrets.js'
import { makeExtraAppConfigurations } from '#root/core/shared/utils/env/make_extra_app_configurations.js'
import { mysqlDatabaseUrl } from '#root/core/shared/utils/env/make_mysql_database_validator.js'
import { redisDatabaseUrl } from '#root/core/shared/utils/env/make_redis_url_validator.js'

export type AppEnvVariables = typeof appEnv

export const SHORT_NAME = 'kibastack'

export const appEnv = makeExtraAppConfigurations(
  makeEnvSecrets(
    cleanEnv(process.env, {
      // Http server
      PORT: port(),
      HOST: host(),

      // Encryption & security
      APP_KEY: str(),

      // Environment
      NODE_ENV: str({
        choices: ['development', 'test', 'production', 'staging', 'test-playwright'],
        default: 'development',
      }),
      APP_URL: url(),

      // Databases
      REDIS_URL: redisDatabaseUrl(),
      DATABASE_URL: mysqlDatabaseUrl(),

      // Email (for transactional emails like team invites, password resets)
      SMTP_HOST: str(),
      SMTP_PORT: port(),
      SMTP_USER: str(),
      SMTP_PASS: str(),
      SMTP_MAIL_FROM: str(),

      // logging
      LOG_LEVEL: str(),

      // auth
      OAUTH_GITHUB_CLIENT_ID: str(),
      OAUTH_GITHUB_CLIENT_SECRET: str(),
      OAUTH_GITHUB_CALLBACK_URL: str(),

      OAUTH_GOOGLE_CLIENT_ID: str(),
      OAUTH_GOOGLE_CLIENT_SECRET: str(),
      OAUTH_GOOGLE_CALLBACK_URL: str(),

      // assets
      ASSETS_URL: str(),
    }),
  ),
  {
    software: {
      shortName: SHORT_NAME,
      teamHeader: `x-${SHORT_NAME}-team-id`,
    },
  },
)
