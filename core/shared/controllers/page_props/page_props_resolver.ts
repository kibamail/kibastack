import type { DefaultPageProps } from '#root/pages/types/page-context.js'

import type { HonoContext } from '#root/core/shared/server/types.js'

import type { PagePropsResolverContract } from '#root/core/shared/controllers/page_props/page_props_resolver_contract.js'
// Essential props resolvers for authentication and team management

export class PagePropsResolver {
  protected resolvers: Array<{
    new (): PagePropsResolverContract
    regex: (RegExp | string | ((pathname: string) => boolean))[]
  }> = []

  handle = async (ctx: HonoContext, defaultPageProps: DefaultPageProps) => {
    const pathname = new URL(ctx.req.url)?.pathname.split('/index.pageContext.json')?.[0]

    const resolver = this.makeResolver(pathname)

    if (!resolver) {
      return defaultPageProps
    }

    const props = await resolver.resolve(pathname, defaultPageProps, ctx)

    return { ...props, ...defaultPageProps }
  }

  private makeResolver(pathname: string) {
    const resolver = this.resolvers.find((resolver) =>
      resolver.regex.some((route) => {
        if (typeof route === 'string') {
          return pathname === route
        }

        if (typeof route === 'function') {
          return route(pathname)
        }

        return route.test(pathname)
      }),
    )

    if (!resolver) {
      return null
    }

    return new resolver()
  }
}
