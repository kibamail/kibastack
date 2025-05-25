import { appEnv } from '#root/core/app/env/app_env.js'

import { TeamMembershipRepository } from '#root/core/teams/repositories/team_membership_repository.js'

import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'
import { SignedUrlManager } from '#root/core/shared/utils/links/signed_url_manager.js'

import { container } from '#root/core/utils/typi.js'

export interface SendTeamMemberInviteJobPayload {
  inviteId: string
}

export class SendTeamMemberInviteJob extends BaseJob<SendTeamMemberInviteJobPayload> {
  static get id() {
    return 'ACCOUNTS::SEND_TEAM_MEMBER_INVITE'
  }

  static get queue() {
    return AVAILABLE_QUEUES.accounts
  }

  async handle({ payload }: JobContext<SendTeamMemberInviteJobPayload>) {
    const invite = await container
      .make(TeamMembershipRepository)
      .findById(payload.inviteId)

    if (!invite) {
      return this.done()
    }

    const token = new SignedUrlManager(appEnv.APP_KEY).encode(
      payload.inviteId.toString(),
      {},
    )

    // todo: send email using @kibamail/sdk

    return this.done()
  }

  async failed({ payload, logger }: JobContext<SendTeamMemberInviteJobPayload>) {
    logger.error(`Failed to send team member invite for invite ID: ${payload.inviteId}`)
  }
}
