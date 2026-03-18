'use client'

import { LoginForm } from '@/components/login-form'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadLogo = async () => {
      try {
        const response = await fetch('/api/configuraciones/logo')
        if (!response.ok) return

        const body = (await response.json()) as {
          data?: {
            url?: string | null
          } | null
        }

        const nextLogoUrl = body?.data?.url || undefined
        if (isMounted) {
          setLogoUrl(nextLogoUrl)
        }
      } catch {
        // Keep default visual fallback when logo request fails.
      }
    }

    void loadLogo()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      if (!response.ok) {
        setError('Credenciales inválidas')
        return
      }

      await response.json().catch(() => null)

      router.push('/home')
      router.refresh()
    } catch {
      setError('No se pudo iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-background relative min-h-screen overflow-hidden px-4">
      {/* Fondo gradiente */}
      <div className="bg-primary/15 pointer-events-none absolute inset-x-0 top-[-20%] h-[40%] blur-3xl" />

      {/* Login Form */}
      <div className="relative grid min-h-screen place-items-center">
        <div className="w-full max-w-sm md:max-w-4xl">
          <LoginForm
            logo={logoUrl}
            email={email}
            password={password}
            error={error}
            onEmailChange={(e) => setEmail(e.target.value)}
            onPasswordChange={(e) => setPassword(e.target.value)}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  )
}
