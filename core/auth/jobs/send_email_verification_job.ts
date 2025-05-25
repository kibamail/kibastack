import { appEnv } from '#root/core/app/env/app_env.js'

import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'

import { container } from '#root/core/utils/typi.js'

export interface SendEmailVerificationJobPayload {
  userId: string
  verificationCode: string
}

export class SendEmailVerificationJob extends BaseJob<SendEmailVerificationJobPayload> {
  static get id() {
    return 'AUTH::SEND_EMAIL_VERIFICATION'
  }

  static get queue() {
    return AVAILABLE_QUEUES.auth
  }

  async handle({ payload }: JobContext<SendEmailVerificationJobPayload>) {
    const user = await container.make(UserRepository).findById(payload.userId)

    if (!user) {
      return this.done()
    }

    // todo: send email using @kibamail/sdk

    return this.done()
  }

  async failed({ payload, logger }: JobContext<SendEmailVerificationJobPayload>) {
    logger.error(`Failed to send email verification to user: ${payload.userId}`)
  }
}
