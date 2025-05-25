import { useApplicationLayoutContext } from '#root/pages/components/dashboard/layout/application-layout-context.jsx'
import { FooterMenuItems } from '#root/pages/components/dashboard/layout/footer-menu-items.jsx'
import { SearchBoxTrigger } from '#root/pages/components/dashboard/layout/sidebar/search-box-trigger.jsx'
import { SubmenuItemLink } from '#root/pages/components/dashboard/layout/submenu-item-link.jsx'
import { WorkspacesDropdownMenu } from '#root/pages/components/dashboard/layout/workspace-dropdown-menu.jsx'
import { BookStackIcon } from '#root/pages/components/icons/book-stack.svg.jsx'
// HelpCircleIcon removed - not needed
import { HomeAltSlimHorizIcon } from '#root/pages/components/icons/home-alt-slim-horiz.jsx'
// Product icons removed - not needed for auth-only stack
import { SidebarCollapseIcon } from '#root/pages/components/icons/sidebar-collapse.svg.jsx'
// Email credits removed - not needed for auth stack
import { route } from '#root/core/shared/routes/route_aliases.js'
// Button and Progress removed - not needed for auth stack
import { Text } from '@kibamail/owly/text'
import { usePageContext } from 'vike-react/usePageContext'

interface SidebarContentProps {
  rootId: string
}

// Progress bar function removed - not needed for auth stack

export function SidebarContent({ rootId }: SidebarContentProps) {
  const { isMobile } = usePageContext()
  const { setSidebar } = useApplicationLayoutContext('Sidebar')

  function setSidebarOffscreen() {
    if (isMobile) {
      setSidebar((current) => ({ ...current, floating: false }))

      return
    }

    setSidebar((current) => ({ ...current, offscreen: true }))
  }

  // Credits calculation removed - not needed for auth stack

  return (
    <>
      <div id={`${rootId}-content`} className="grow w-full">
        <div className="py-2 px-1 flex items-center gap-x-2">
          <WorkspacesDropdownMenu rootId={rootId} />

          <button
            aria-label="Collapse sidebar"
            className="kb-reset"
            type="button"
            onClick={setSidebarOffscreen}
          >
            <SidebarCollapseIcon className="kb-content-tertiary-inverse" />
          </button>
        </div>

        <div className="my-3">
          <SearchBoxTrigger />
        </div>

        <div className="flex flex-col">
          <SubmenuItemLink href={route('welcome')}>
            <BookStackIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Get Started</Text>
          </SubmenuItemLink>

          <SubmenuItemLink href={route('dashboard')}>
            <HomeAltSlimHorizIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Dashboard</Text>
          </SubmenuItemLink>

          {/* Community/Chat and Products removed - not part of auth stack */}
        </div>
      </div>

      <div className="justify-end px-2 py-2 flex flex-col gap-y-2">
        <div className="flex items-center justify-between">
          <FooterMenuItems />
        </div>
      </div>
    </>
  )
}
