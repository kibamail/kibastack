import { makeDatabase } from '#root/core/shared/container/index.js'
import { users, teams, teamMemberships, oauth2Accounts, passwordResets } from '#root/database/schema.js'

export async function refreshDatabase() {
  const database = makeDatabase()
  
  // Delete all data in reverse dependency order
  await database.delete(passwordResets)
  await database.delete(oauth2Accounts)
  await database.delete(teamMemberships)
  await database.delete(teams)
  await database.delete(users)
  
  console.log('Database refreshed successfully')
}
