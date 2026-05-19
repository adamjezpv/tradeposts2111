'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeOpacity="0.6" />
        <rect x="8" y="0.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeOpacity="0.6" />
        <rect x="0.5" y="8" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeOpacity="0.6" />
        <rect x="8" y="8" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeOpacity="0.6" />
      </svg>
    ),
  },
  {
    href: '/locations',
    label: 'Locations',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7" cy="5.5" r="2" stroke="currentColor" strokeOpacity="0.6" />
        <path d="M7 13C7 13 2 9 2 5.5C2 2.91 4.24 1 7 1C9.76 1 12 2.91 12 5.5C12 9 7 13 7 13Z" stroke="currentColor" strokeOpacity="0.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/posts',
    label: 'Posts',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="13" height="13" rx="1.5" stroke="currentColor" strokeOpacity="0.6" />
        <line x1="3" y1="4.5" x2="11" y2="4.5" stroke="currentColor" strokeOpacity="0.6" />
        <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeOpacity="0.6" />
        <line x1="3" y1="9.5" x2="8" y2="9.5" stroke="currentColor" strokeOpacity="0.6" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7" cy="7" r="2" stroke="currentColor" strokeOpacity="0.6" />
        <path d="M7 1V2.5M7 11.5V13M1 7H2.5M11.5 7H13M2.93 2.93L3.99 3.99M10.01 10.01L11.07 11.07M11.07 2.93L10.01 3.99M3.99 10.01L2.93 11.07" stroke="currentColor" strokeOpacity="0.6" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-[220px] flex-shrink-0 h-full flex flex-col border-r border-white/[0.07] bg-black">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-white/[0.05]">
        <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
          <div className="w-3 h-3 rounded-sm bg-black" />
        </div>
        <span className="font-semibold text-white tracking-tight text-sm">TradePosts</span>
        <span className="text-white/25 text-xs">.io</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-white/[0.08] text-white font-medium'
                  : 'text-white/35 hover:text-white/65 hover:bg-white/[0.04]'
              }`}
            >
              <span className={isActive ? 'text-white/70' : 'text-white/30'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 border-t border-white/[0.05] pt-4">
        <div className="px-3 py-1.5 mb-1">
          <p className="text-white/25 text-xs truncate leading-relaxed">{userEmail}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/25 hover:text-white/55 hover:bg-white/[0.04] transition-all duration-150 text-left"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 1H2C1.45 1 1 1.45 1 2V12C1 12.55 1.45 13 2 13H5" stroke="currentColor" strokeOpacity="0.5" strokeLinecap="round" />
            <path d="M10 10L13 7L10 4" stroke="currentColor" strokeOpacity="0.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="13" y1="7" x2="5" y2="7" stroke="currentColor" strokeOpacity="0.5" strokeLinecap="round" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )
}
