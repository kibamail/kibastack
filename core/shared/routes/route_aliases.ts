function trimLastSlash(path: string) {
  return path.endsWith('/') ? path.slice(0, -1) : path
}

function w(path: string) {
  return `/w/${trimLastSlash(path)}`
}

export const aliases = {
  // email/password registration
  auth_register: '/auth/register',
  auth_register_password: '/auth/register/password',
  auth_register_profile: '/auth/register/profile',
  auth_register_email_confirm: '/auth/register/email/confirm',
  auth_passwords_forgot: '/auth/passwords/forgot',
  auth_passwords_reset: '/auth/passwords/reset/:token',

  auth_oauth2_provider: '/auth/:action/oauth2/:provider/authorize',

  // login
  auth_login: '/auth/login',

  // logout
  auth_logout: '/auth/logout',

  // dashboard
  welcome: w('welcome'),
  dashboard: w('dashboard'),

  // teams
  teams_switch: '/teams/:teamId/switch',

  // error pages
  error_404: '/e/404',
  error_500: '/e/500',
} as const

export function route(
  alias: keyof typeof aliases,
  routeParams?: Record<string, string>,
  queryParams?: Record<string, string>,
) {
  let path = aliases[alias]

  if (routeParams) {
    for (const [key, value] of Object.entries(routeParams)) {
      path = path.replace(`:${key}`, value)
    }
  }

  let queryString = ''

  if (queryParams) {
    queryString = new URLSearchParams(queryParams).toString()
  }

  return `${path}${queryString ? `?${queryString}` : ''}`
}

export function wRoute() {}
