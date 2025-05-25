import { Queue as BullQueue } from 'bullmq'
import { AVAILABLE_QUEUES } from './config.js'

import { makeRedis } from '#root/core/shared/container/index.js'

export const AccountsQueue = () =>
  new BullQueue(AVAILABLE_QUEUES.accounts, {
    connection: makeRedis(),
  })

export const AuthQueue = () =>
  new BullQueue(AVAILABLE_QUEUES.auth, {
    connection: makeRedis(),
  })

export class Queues {
  accounts = AccountsQueue
  auth = AuthQueue
}

export const Queue = new Queues()
