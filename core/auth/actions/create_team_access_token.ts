import { container } from '#root/core/utils/typi.js'
import { AccessTokenRepository } from '#root/core/auth/access_tokens/repositories/access_token_repository.js'

export class CreateTeamAccessTokenAction {
  constructor(private accessTokenRepository = container.make(AccessTokenRepository)) {}

  handle = async (teamId: string) => {
    const { apiKey } = await this.accessTokenRepository.create(teamId, 'team', [])

    return { apiKey }
  }
}
