import { Worker } from 'bullmq'
import { appEnv } from '#root/core/app/env/app_env.js'
import { createDatabaseClient, createDrizzleDatabase } from '#root/database/client.js'
import { createRedisDatabaseInstance } from '#root/core/redis/redis_client.js'
import { container } from '#root/core/utils/typi.js'
import { ContainerKey, makeRedis } from '#root/core/shared/container/index.js'
import { pino } from 'pino'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'

// Import job handlers
import { SendTeamMemberInviteJob } from '#root/core/teams/jobs/send_team_member_invite_job.js'
import { SendPasswordResetJob } from '#root/core/auth/jobs/send_password_reset_job.js'
import { SendEmailVerificationJob } from '#root/core/auth/jobs/send_email_verification_job.js'

const logger = pino({
  level: appEnv.LOG_LEVEL,
  transport: appEnv.isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      }
    : undefined,
})

// Register dependencies in container
container.register(ContainerKey.env, appEnv)
container.register(ContainerKey.logger, logger)

// Setup database connections
const databaseConnection = await createDatabaseClient(appEnv.DATABASE_URL)
const database = createDrizzleDatabase(databaseConnection)
const redis = createRedisDatabaseInstance(appEnv.REDIS_URL)

container.register(ContainerKey.database, database)
container.register(ContainerKey.databaseConnection, databaseConnection)
container.register(ContainerKey.redis, redis)

// Job registry - maps job IDs to their handlers
const jobRegistry = new Map<string, any>([
  [SendTeamMemberInviteJob.id, SendTeamMemberInviteJob],
  [SendPasswordResetJob.id, SendPasswordResetJob],
  [SendEmailVerificationJob.id, SendEmailVerificationJob],
])

// Worker processor function
async function processJob(job: { name: string; data: any }) {
  const JobClass = jobRegistry.get(job.name)

  if (!JobClass) {
    logger.error(`Unknown job type: ${job.name}`)
    throw new Error(`Unknown job type: ${job.name}`)
  }

  const jobInstance = new JobClass()

  try {
    const result = await jobInstance.handle({
      database,
      redis: makeRedis(),
      payload: job.data,
      logger,
    })

    if (!result.success) {
      throw new Error(result.output as string || 'Job failed')
    }

    return result.output
  } catch (error) {
    logger.error(`Job ${job.name} failed:`, error)

    // Call the job's failed handler if it exists
    if (typeof jobInstance.failed === 'function') {
      await jobInstance.failed({
        database,
        redis: makeRedis(),
        payload: job.data,
        logger,
      })
    }

    throw error
  }
}

// Create workers for each queue
const workers: Worker[] = []

// Auth queue worker (for team invites, password resets, etc.)
const authWorker = new Worker(AVAILABLE_QUEUES.auth, processJob, {
  connection: makeRedis(),
  concurrency: 5,
})

workers.push(authWorker)

// Accounts queue worker (for team management jobs)
const accountsWorker = new Worker(AVAILABLE_QUEUES.accounts, processJob, {
  connection: makeRedis(),
  concurrency: 3,
})

workers.push(accountsWorker)

// Setup worker event handlers
workers.forEach((worker, index) => {
  const queueName = Object.values(AVAILABLE_QUEUES)[index]

  worker.on('completed', (job) => {
    logger.info(`Job ${job.name} completed in queue ${queueName}`)
  })

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.name} failed in queue ${queueName}:`, err)
  })

  worker.on('error', (err) => {
    logger.error(`Worker error in queue ${queueName}:`, err)
  })
})

logger.info('Worker started successfully')

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down workers...')

  await Promise.all(workers.map(worker => worker.close()))
  databaseConnection.end()
  redis.disconnect()

  logger.info('Workers shut down successfully')
  process.exit(0)
})
