import { relations, sql } from 'drizzle-orm'
import {
  customType,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
  json,
} from 'drizzle-orm/mysql-core'
import { v1 } from 'uuid'

/**
 * Custom type for efficiently storing UUIDs in MySQL.
 *
 * This custom type implementation optimizes UUID storage by using MySQL's binary type
 * instead of storing UUIDs as strings. Key benefits include:
 *
 * 1. Reduced storage space: 16 bytes for binary vs 36 bytes for string UUIDs
 * 2. Improved query performance: Binary comparisons are faster than string comparisons
 * 3. Proper indexing: Binary UUIDs can be efficiently indexed
 *
 * The implementation handles conversion between string UUIDs (used in application code)
 * and binary UUIDs (stored in the database) transparently. It uses MySQL's UUID_TO_BIN
 * function with time-based ordering (swapping time-low and time-high components) to
 * improve index efficiency for time-based UUIDs.
 */
export const binaryUuid = customType<{
  data: string
  driverData: Buffer
  config: { length?: number }
}>({
  dataType(config) {
    return typeof config?.length !== 'undefined' ? `binary(${config.length})` : 'binary'
  },
  fromDriver(buf) {
    // Convert binary UUID back to string format with proper byte ordering
    return [
      buf.toString('hex', 4, 8), // time-low
      buf.toString('hex', 2, 4), // time-mid
      buf.toString('hex', 0, 2), // time-high-and-version
      buf.toString('hex', 8, 10), // clock-seq-and-reserved + clock-seq-low
      buf.toString('hex', 10, 16), // node
    ].join('-')
  },
  toDriver(value: string) {
    // Convert string UUID to optimized binary format
    return uuidToBin(value)
  },
})

export const uuidToBin = (uuid: string) => sql`UUID_TO_BIN(${uuid}, 1)`

export const primaryKeyCuid = <TName extends string>(name: TName) =>
  binaryUuid(name, { length: 16 })

export const id = primaryKeyCuid('id').primaryKey().$defaultFn(v1)

export const usersColumns = {
  id,
  email: varchar('email', { length: 80 }).unique().notNull(),
  unconfirmedEmail: varchar('unconfirmedEmail', { length: 80 }),
  firstName: varchar('firstName', { length: 80 }),
  lastName: varchar('lastName', { length: 80 }),
  avatarUrl: varchar('avatarUrl', { length: 256 }),
  password: varchar('password', { length: 256 }),
  emailVerificationCode: varchar('emailVerificationCode', { length: 256 }),
  emailVerifiedAt: timestamp('emailVerifiedAt'),
  emailVerificationCodeExpiresAt: timestamp('emailVerificationCodeExpiresAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  role: mysqlEnum('role', ['customer', 'support', 'team']).$default(() => 'customer'),
  lastLoggedInAt: timestamp('lastLoggedInAt'),
  lastPasswordResetAt: timestamp('lastPasswordResetAt'),
  lastLoggedInProvider: mysqlEnum('lastLoggedInProvider', [
    'password',
    'github',
    'google',
  ]),
}
export const users = mysqlTable('users', {
  ...usersColumns,
})

export const oauth2AccountsColumns = {
  id,
  userId: primaryKeyCuid('userId')
    .references(() => users.id)
    .notNull(),
  provider: mysqlEnum('provider', ['github', 'google']).notNull(),
  providerId: varchar('providerId', { length: 80 }).unique().notNull(),
  accessToken: text('accessToken').notNull(),
}

export const oauth2Accounts = mysqlTable(
  'oauth2Accounts',
  {
    ...oauth2AccountsColumns,
  },
  (table) => ({
    Oauth2AccountProviderUserId: unique('Oauth2AccountProviderUserIdKey').on(
      table.userId,
      table.provider,
    ),
  }),
)

export function oauth2AccountsConstraints(table: typeof oauth2Accounts) {
  return {
    Oauth2AccountProviderUserId: unique('Oauth2AccountProviderUserIdKey').on(
      table.userId,
      table.provider,
    ),
  }
}

export const passwordResetsColumns = {
  id,
  userId: primaryKeyCuid('userId')
    .references(() => users.id)
    .unique()
    .notNull(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  usedAt: timestamp('usedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}

export const passwordResets = mysqlTable('passwordResets', {
  ...passwordResetsColumns,
})

/**
 * Teams table - Core entity for multi-tenant functionality.
 *
 * The teams table implements multi-tenant architecture, allowing the system
 * to support multiple organizations with isolated data and configurations. Each team:
 *
 * - Represents a distinct organization or business unit
 * - Can have multiple team members with different permission levels
 * - Maintains separate configuration settings
 *
 * Teams are the foundation of the permission system, as all resources
 * are associated with a team, and users access resources through team memberships.
 */
export const teamsColumns = {
  id,
  name: varchar('name', { length: 100 }).notNull(),
  userId: primaryKeyCuid('userId')
    .notNull()
    .references(() => users.id),
}

export const teams = mysqlTable('teams', {
  ...teamsColumns,
})

export const teamMembershipsColumns = {
  id,
  userId: primaryKeyCuid('userId').references(() => users.id),
  email: varchar('email', { length: 50 }).notNull(),
  teamId: primaryKeyCuid('teamId')
    .references(() => teams.id)
    .notNull(),
  role: mysqlEnum('role', ['ADMINISTRATOR', 'MANAGER', 'AUTHOR', 'GUEST']),
  status: mysqlEnum('status', ['PENDING', 'ACTIVE']),
  invitedAt: timestamp('invitedAt').defaultNow().notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
}

export const teamMemberships = mysqlTable('teamMemberships', {
  ...teamMembershipsColumns,
})

export const accessTokensColumns = {
  id,
  userId: primaryKeyCuid('userId').references(() => users.id),
  teamId: primaryKeyCuid('teamId').references(() => teams.id),
  name: varchar('name', { length: 32 }),
  accessKey: varchar('accessKey', { length: 255 }),
  capabilities: json('capabilities').$type<string[]>(),
  accessSecret: varchar('accessSecret', { length: 255 }).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  lastUsedAt: timestamp('lastUsedAt').defaultNow().notNull(),
  expiresAt: timestamp('expiresAt').defaultNow().notNull(),
}

export const accessTokens = mysqlTable('accessTokens', {
  ...accessTokensColumns,
})

/* --------------------------- */
/*      Table relations        */
/* --------------------------- */
export const userRelations = relations(users, ({ many }) => ({
  oauth2Accounts: many(oauth2Accounts),
  passwordResets: many(passwordResets),
  teamMemberships: many(teamMemberships),
}))

export const teamRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, {
    fields: [teams.userId],
    references: [users.id],
  }),
  teamMemberships: many(teamMemberships),
}))

export const teamMembershipRelations = relations(teamMemberships, ({ one }) => ({
  user: one(users, {
    fields: [teamMemberships.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMemberships.teamId],
    references: [teams.id],
  }),
}))

export const oauth2AccountRelations = relations(oauth2Accounts, ({ one }) => ({
  user: one(users, {
    fields: [oauth2Accounts.userId],
    references: [users.id],
  }),
}))

export const passwordResetRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, {
    fields: [passwordResets.userId],
    references: [users.id],
  }),
}))
