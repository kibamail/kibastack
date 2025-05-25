import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { type AppEnvVariables, appEnv } from '#root/core/app/env/app_env.js'
import type { Redis } from 'ioredis'
import { type Logger, pino } from 'pino'

import { TeamController } from '#root/core/teams/controllers/team_controller.js'
import { TeamMembershipController } from '#root/core/teams/controllers/team_membership_controller.js'

import { AuthController } from '#root/core/auth/controllers/auth_controller.js'
import { Oauth2Controller } from '#root/core/auth/controllers/oauth2_controller.js'
import { RegisterController } from '#root/core/auth/controllers/register_controller.js'
import { UserController } from '#root/core/auth/controllers/user_controller.js'
import { PasswordResetsController } from '#root/core/auth/password_resets/controllers/password_resets_controller.js'

import { Queue } from '#root/core/shared/queue/queue.js'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js'
import { HonoAdapter } from '@bull-board/hono'
import { serveStatic } from '@hono/node-server/serve-static'

import {
  type DrizzleClient,
  createDatabaseClient,
  createDrizzleDatabase,
} from '#root/database/client.js'
import {
  ContainerKey,
  makeDatabaseConnection,
  makeRedis,
} from '#root/core/shared/container/index.js'
import { middleware } from '#root/core/shared/middleware/middleware_aliases.js'
import { Hono, type HonoInstance } from '#root/core/shared/server/hono.js'
import '#root/core/shared/utils/log/dump.js'

import { createRedisDatabaseInstance } from '#root/core/redis/redis_client.js'

import { container } from '#root/core/utils/typi.js'
import { AssetController } from '#root/core/assets/controllers/asset_controller.js'

export class Ignitor {
  public app: HonoInstance
  public env: AppEnvVariables
  protected database: DrizzleClient
  protected redis: Redis
  protected logger: Logger

  boot() {
    this.env = appEnv
    container.register(ContainerKey.env, this.env)

    this.logger = pino({
      level: this.env.LOG_LEVEL,
      transport: this.env.isDev
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
            },
          }
        : undefined,
      enabled: this.env.isProd || this.env.isStaging,
    })

    container.register(ContainerKey.logger, this.logger)

    this.app = new Hono()

    container.register(ContainerKey.app, this.app)

    return this
  }

  protected setupBullmqDashboard() {
    const adapter = new HonoAdapter(serveStatic)

    createBullBoard({
      queues: [
        new BullMQAdapter(Queue.auth()),
        new BullMQAdapter(Queue.accounts()),
      ],
      serverAdapter: adapter,
    })

    const basePath = '/queues'

    adapter.setBasePath(basePath)
    this.app.route(basePath, adapter.registerPlugin())

    // _showRoutes(this.app)
  }

  async start() {
    const packageJsonFile = await readFile(resolve('package.json'), 'utf-8')

    const { version } = JSON.parse(packageJsonFile)

    container.register(ContainerKey.version, version)

    await this.startDatabaseConnector()

    this.app.use(middleware('user_session'))

    this.registerHttpControllers()

    this.setupBullmqDashboard()
    await this.startSinglePageApplication()

    return this
  }

  async startSinglePageApplication() {
    // no implementation in prod. Only in dev.
  }

  async startDatabaseConnector() {
    if (this.database) return this

    const connection = await createDatabaseClient(this.env.DATABASE_URL)
    const redisConnection = createRedisDatabaseInstance(this.env.REDIS_URL)

    this.database = createDrizzleDatabase(connection)

    this.redis = redisConnection

    container.registerInstance(ContainerKey.redis, this.redis)
    container.registerInstance(ContainerKey.database, this.database)
    container.registerInstance(ContainerKey.databaseConnection, connection)

    return this
  }

  startHttpServer() {}

  registerHttpControllers() {
    container.resolve(AuthController)
    container.resolve(Oauth2Controller)
    container.resolve(RegisterController)
    container.resolve(PasswordResetsController)
    container.resolve(UserController)
    container.resolve(TeamController)
    container.resolve(TeamMembershipController)

    container.resolve(AssetController)
  }

  async shutdown() {
    const connection = makeDatabaseConnection()
    const redis = makeRedis()

    if (connection) {
      connection.destroy()
    }

    redis.disconnect()
  }
}
