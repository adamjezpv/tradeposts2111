import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from './_components/Sidebar'

export const runtime = 'edge'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle()

  const plan = profile?.plan ?? 'trial'

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <Sidebar userEmail={user.email ?? ''} plan={plan} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
