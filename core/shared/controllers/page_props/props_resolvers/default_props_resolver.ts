import type { HonoContext } from '#root/core/shared/server/types.js'
import { excludeKeys } from '#root/core/shared/utils/helpers/exclude_keys'
import { UAParser } from 'ua-parser-js'

export class DefaultPropsResolver {
  async resolve(ctx: HonoContext) {
    const userAgentHeader = ctx.req.header('user-agent')
    const userAgent = userAgentHeader ? new UAParser(userAgentHeader) : undefined

    return {
      user: excludeKeys(ctx.get('user'), [
        'emailVerificationCodeExpiresAt',
        'emailVerificationCode',
        'password',
      ]),
      flash: ctx.get('flash'),
      userAgent: userAgent
        ? {
            browser: userAgent.getBrowser(),
            os: userAgent.getOS(),
            device: userAgent.getDevice(),
          }
        : undefined,
      isMobile: userAgent?.getDevice().type === 'mobile',
      memberships: ctx.get('memberships'),
      team: ctx.get('team'),
    }
  }
}
