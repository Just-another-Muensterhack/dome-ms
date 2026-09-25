import type { PropsWithChildren } from 'react'
import { useLayoutEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { OnboardingGate } from '@/components/onboarding/OnboardingGate'
import {
  authCallbackPath,
  consumeAuthorizationCallback,
  ensureAccessToken
} from '@/utils/auth'

type AuthStatus = 'pending' | 'in' | 'out'

const dashboardPath = '/dashboard'

export const AuthGate = ({
  children,
}: PropsWithChildren) => {
  const router = useRouter()
  const [status, setStatus] = useState<AuthStatus>('pending')

  useLayoutEffect(() => {
    if (!router.isReady) {
      return
    }

    let cancelled = false

    const settle = async () => {
      if (router.pathname === authCallbackPath) {
        try {
          await consumeAuthorizationCallback(window.location.search)
          if (cancelled) {
            return
          }
          setStatus('in')
          await router.replace(dashboardPath)
        } catch {
          if (cancelled) {
            return
          }
          setStatus('out')
          await router.replace('/?login=failed')
        }
        return
      }

      const token = await ensureAccessToken()
      if (cancelled) {
        return
      }

      const loggedIn = token !== undefined
      setStatus(loggedIn ? 'in' : 'out')

      if (!loggedIn && router.pathname !== '/') {
        await router.replace('/')
        return
      }

      if (loggedIn && router.pathname === '/') {
        await router.replace(dashboardPath)
      }
    }

    void settle()

    return () => {
      cancelled = true
    }
  }, [router, router.isReady, router.pathname])

  if (status === 'pending' || router.pathname === authCallbackPath) {
    return null
  }

  if (status === 'out' && router.pathname !== '/') {
    return null
  }

  if (status === 'in' && router.pathname === '/') {
    return null
  }

  if (status === 'out') {
    return children
  }

  return (
    <OnboardingGate>
      {children}
    </OnboardingGate>
  )
}
