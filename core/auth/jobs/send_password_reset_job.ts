import { appEnv } from '#root/core/app/env/app_env.js'

import { PasswordResetRepository } from '#root/core/auth/password_resets/repositories/password_reset_repository.js'
import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

import { Mailer } from '#root/core/shared/mailers/mailer.js'
import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'

import { container } from '#root/core/utils/typi.js'

export interface SendPasswordResetJobPayload {
  email: string
  resetToken: string
}

export class SendPasswordResetJob extends BaseJob<SendPasswordResetJobPayload> {
  static get id() {
    return 'AUTH::SEND_PASSWORD_RESET'
  }

  static get queue() {
    return AVAILABLE_QUEUES.auth
  }

  async handle({ payload }: JobContext<SendPasswordResetJobPayload>) {
    const user = await container
      .make(UserRepository)
      .findByEmail(payload.email)

    if (!user) {
      return this.done()
    }

    const resetUrl = `${appEnv.APP_URL}/auth/passwords/reset/${payload.resetToken}?email=${encodeURIComponent(payload.email)}`

    await Mailer.from(appEnv.SMTP_MAIL_FROM)
      .to(payload.email)
      .subject('Reset your KibaStack password')
      .content(
        JSON.stringify({
          transactionalEmailId: 'password_reset',
          variables: {
            resetUrl,
            firstName: user.firstName || 'there',
          },
        }),
      )
      .send()

    return this.done()
  }

  async failed({ payload, logger }: JobContext<SendPasswordResetJobPayload>) {
    logger.error(`Failed to send password reset email to: ${payload.email}`)
  }
}
