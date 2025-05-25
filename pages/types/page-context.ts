import type {
  Team,
  TeamMembership,
  TeamWithMemberships,
  UserWithTeams,
} from '#root/database/database_schema_types.js'

export interface DefaultPageProps<T = object> {
  user: UserWithTeams
  team: TeamWithMemberships
  pageProps: T
  userAgent: UAParser.IResult
  memberships: (TeamMembership & { team: Team })[]
  isMobile: boolean
  flash: string
}

export type DefaultPageContext = {
  pageProps: DefaultPageProps
}

declare global {
  namespace Vike {
    interface PageContext extends DefaultPageProps {}
  }
}
