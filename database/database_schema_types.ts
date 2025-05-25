import type { InferSelectModel } from 'drizzle-orm'
import type { MySqlUpdateSetSource } from 'drizzle-orm/mysql-core'
import type {
  oauth2Accounts,
  passwordResets,
  teamMemberships,
  teams,
  users,
  accessTokens,
} from './schema.js'

import type { makeDatabase } from '#root/core/shared/container/index.js'

export type User = InferSelectModel<typeof users>
export type Team = InferSelectModel<typeof teams>
export type TeamMembership = InferSelectModel<typeof teamMemberships>
export type Oauth2Account = InferSelectModel<typeof oauth2Accounts>
export type PasswordReset = InferSelectModel<typeof passwordResets>
export type FindUserByIdArgs = Parameters<
  ReturnType<typeof makeDatabase>['query']['users']['findFirst']
>[0]

// Essential insert types
export type InsertUser = typeof users.$inferInsert
export type InsertTeamMembership = typeof teamMemberships.$inferInsert
export type InsertPasswordReset = typeof passwordResets.$inferInsert

// Essential update types
export type UpdatePasswordReset = MySqlUpdateSetSource<typeof passwordResets>
export type UpdateUser = MySqlUpdateSetSource<typeof users>
export type UpdateSetTeamMembershipInput = MySqlUpdateSetSource<typeof teamMemberships>

// Essential relationship types
export type UserWithTeams = User & { teams: Team[] }

export type TeamWithMemberships = Team & {
  members: TeamMembership[]
}

export type AccessToken = InferSelectModel<typeof accessTokens>
