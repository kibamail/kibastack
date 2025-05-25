import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'

import { route } from '#root/core/shared/routes/route_aliases.js'

function WelcomePage() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 lg:px-0 py-12">
      <div className="mt-24" />
      <div className="border-t kb-border-tertiary py-8">
        <Heading size="xs" variant="display">
          Welcome to KibaStack Auth
        </Heading>

        <Text as="p" className="kb-content-tertiary mt-2 max-w-lg">
          Your authentication and team management platform is ready to use.
          You can manage your team, invite members, and configure your account settings.
        </Text>

        <div className="mt-8">
          <a
            href={route('dashboard')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}

export { WelcomePage as Page }
