import { resetDatabaseCommand } from '#root/cli/commands/reset_database_command.js'
import { IgnitorCli } from '#root/cli/ignitor/ignitor_cli.js'
import { run } from '@drizzle-team/brocli'

const ignitor = await new IgnitorCli().boot().start()

await run([
  // database
  resetDatabaseCommand,
])

await ignitor.shutdown()
