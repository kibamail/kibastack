export const AVAILABLE_QUEUES = {
  auth: 'auth',
  accounts: 'accounts',
} as const

export type AVAILABLE_QUEUE_TYPE = keyof typeof AVAILABLE_QUEUES
