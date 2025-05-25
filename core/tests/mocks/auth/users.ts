import { faker } from '@faker-js/faker'

import { TeamMembershipRepository } from '#root/core/teams/repositories/team_membership_repository.js'
import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import { RegisterUserAction } from '#root/core/auth/actions/register_user_action.js'
import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

import type { TeamMembership, User } from '#root/database/database_schema_types.js'

import { container } from '#root/core/utils/typi.js'

export const createUser = async ({
  createEntireTeam,
}: {
  createEntireTeam?: boolean
} = {}) => {
  const registerUserAction = container.resolve(RegisterUserAction)

  const { user, teamId } = await registerUserAction.handle({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.number.int({ min: 0, max: 99 }) + faker.internet.exampleEmail(),
    emailVerifiedAt: faker.date.past(),
  })

  await container.make(UserRepository).update(user.id, { password: 'password' })

  const teamRepository = container.resolve(TeamRepository)
  const team = await teamRepository.findById(teamId)

  const freshUser = await container.make(UserRepository).findById(user.id)

  let administratorUser: User = undefined as unknown as User
  let managerUser: User = undefined as unknown as User
  let authorUser: User = undefined as unknown as User
  let guestUser: User = undefined as unknown as User

  if (createEntireTeam) {
    const [administrator, manager, author, guest] = await Promise.all([
      registerUserAction.handle({
        firstName: faker.person.fullName(),
        email: faker.internet.exampleEmail(),
        password: 'password',
      }),
      registerUserAction.handle({
        firstName: faker.person.fullName(),
        email: faker.internet.exampleEmail(),
        password: 'password',
      }),
      registerUserAction.handle({
        firstName: faker.person.fullName(),
        email: faker.internet.exampleEmail(),
        password: 'password',
      }),
      registerUserAction.handle({
        firstName: faker.person.fullName(),
        email: faker.internet.exampleEmail(),
        password: 'password',
      }),
    ])

    const teamMembershipRepository = container.make(TeamMembershipRepository)

    for (const [member, role] of [
      [administrator, 'ADMINISTRATOR'],
      [manager, 'MANAGER'],
      [author, 'AUTHOR'],
      [guest, 'GUEST'],
    ] as const) {
      await teamMembershipRepository.create({
        status: 'ACTIVE',
        expiresAt: new Date(),
        role: role as TeamMembership['role'],
        email: '',
        userId: member?.user?.id,
        teamId: team.id,
      })
    }

    const userRepository = container.make(UserRepository)

    administratorUser = (await userRepository.findById(administrator.user.id)) as User
    managerUser = (await userRepository.findById(manager.user.id)) as User

    authorUser = (await userRepository.findById(author.user.id)) as User

    guestUser = (await userRepository.findById(guest.user.id)) as User
  }

  return {
    user: freshUser,
    team,
    administratorUser,
    managerUser,
    guestUser,
    authorUser,
  }
}
