'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const supabase = createClient()

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      setSuccess('Check your email to confirm your account.')
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden px-6">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 grid-bg opacity-100"
          style={{ animation: 'grid-move 8s linear infinite' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(255,255,255,0.03),transparent)]" />
        <div className="animate-float-slow absolute top-16 left-[12%] w-24 h-24 rounded-full border border-white/5 opacity-40" />
        <div className="animate-float-medium absolute bottom-24 right-[10%] w-32 h-32 rounded-full border border-white/5 opacity-30" />
        <div className="animate-float-fast absolute top-[45%] right-[20%] w-12 h-12 border border-white/5 rotate-45 opacity-25" />
        <div className="animate-spin-slow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/[0.03]" />
        <div
          className="animate-spin-slow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/[0.04]"
          style={{ animationDirection: 'reverse', animationDuration: '25s' }}
        />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center group-hover:bg-white/90 transition-colors">
              <div className="w-3.5 h-3.5 rounded-sm bg-black" />
            </div>
            <span className="font-semibold text-white tracking-tight">TradePosts</span>
            <span className="text-white/30 text-sm">.io</span>
          </Link>
        </div>

        {/* Main card */}
        <div className="glass-bright rounded-2xl p-8">
          <h1 className="text-gradient text-2xl font-bold tracking-tight text-center mb-2">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-white/30 text-sm text-center mb-8">
            {mode === 'signin'
              ? 'Sign in to manage your Google Business posts'
              : 'Get started with TradePosts.io'}
          </p>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-white/40 text-xs font-medium tracking-wide uppercase">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-white/40 text-xs font-medium tracking-wide uppercase">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
              />
            </div>

            {error && (
              <p className="text-red-400/80 text-xs text-center leading-relaxed">{error}</p>
            )}
            {success && (
              <p className="text-green-400/80 text-xs text-center leading-relaxed">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-3.5 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading
                ? mode === 'signin'
                  ? 'Signing in…'
                  : 'Creating account…'
                : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
            </button>
          </form>

          {/* Separator */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-white/20 text-xs">or continue with</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Google Sign In */}
          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/70 font-medium text-sm hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </a>

          {/* Terms */}
          <p className="mt-6 text-center text-white/25 text-xs leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="#" className="text-white/40 hover:text-white/60 transition-colors underline underline-offset-2">
              Terms
            </a>{' '}
            and{' '}
            <a href="#" className="text-white/40 hover:text-white/60 transition-colors underline underline-offset-2">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        {/* Mode toggle */}
        <p className="text-center mt-5 text-white/25 text-xs">
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => { setMode('signup'); setError(null); setSuccess(null) }}
                className="text-white/50 hover:text-white/80 transition-colors underline underline-offset-2"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => { setMode('signin'); setError(null); setSuccess(null) }}
                className="text-white/50 hover:text-white/80 transition-colors underline underline-offset-2"
              >
                Sign in
              </button>
            </>
          )}
        </p>

        {/* Back link */}
        <p className="text-center mt-3 text-white/20 text-xs">
          <Link href="/" className="hover:text-white/40 transition-colors">
            ← Back to TradePosts.io
          </Link>
        </p>
      </div>
    </main>
  )
}
