import type { TeamWithMemberships, TeamMembership } from '#root/database/database_schema_types.js'

/**
 * TeamPolicy handles authorization for team-related operations.
 *
 * This policy implements role-based access control for teams:
 * - ADMINISTRATOR: Full access to all team operations
 * - MANAGER: Can manage team content and members (except other admins)
 * - AUTHOR: Can create and edit content
 * - GUEST: Read-only access
 */
export class TeamPolicy {
  /**
   * Check if a user can administrate a team (full admin access)
   */
  canAdministrate(team: TeamWithMemberships, userId?: string): boolean {
    if (!userId || !team) return false

    // Team owner always has admin access
    if (team.userId === userId) return true

    // Check if user is an ADMINISTRATOR member
    const membership = team.members?.find((m: TeamMembership) => m.userId === userId)
    return membership?.role === 'ADMINISTRATOR'
  }

  /**
   * Check if a user can manage a team (admin or manager access)
   */
  canManage(team: TeamWithMemberships, userId?: string): boolean {
    if (!userId || !team) return false

    // Admins can always manage
    if (this.canAdministrate(team, userId)) return true

    // Check if user is a MANAGER
    const membership = team.members?.find((m: TeamMembership) => m.userId === userId)
    return membership?.role === 'MANAGER'
  }

  /**
   * Check if a user can author content in a team
   */
  canAuthor(team: TeamWithMemberships, userId?: string): boolean {
    if (!userId || !team) return false

    // Managers and admins can author
    if (this.canManage(team, userId)) return true

    // Check if user is an AUTHOR
    const membership = team.members?.find((m: TeamMembership) => m.userId === userId)
    return membership?.role === 'AUTHOR'
  }

  /**
   * Check if a user can view a team (any team member)
   */
  canView(team: TeamWithMemberships, userId?: string): boolean {
    if (!userId || !team) return false

    // Team owner can always view
    if (team.userId === userId) return true

    // Any team member can view
    const membership = team.members?.find((m: TeamMembership) => m.userId === userId)
    return !!membership
  }
}
