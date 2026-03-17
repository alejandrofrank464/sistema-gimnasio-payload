'use client'

import { LoginForm } from '@/components/login-form'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [logo, setLogo] = useState<string | undefined>()

  // Obtener el logo de los settings de Payload
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch('/api/configuraciones?depth=1')
        if (response.ok) {
          const data = await response.json()
          const logoField = data.docs?.[0]?.logo
          if (logoField?.url) {
            setLogo(logoField.url)
          } else if (typeof logoField === 'string') {
            // Si es un ID (no expandido), intenta obtener desde media
            const mediaRes = await fetch(`/api/media/${logoField}`)
            if (mediaRes.ok) {
              const mediaData = await mediaRes.json()
              if (mediaData.url) {
                setLogo(mediaData.url)
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching logo:', err)
      }
    }

    fetchLogo()
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

      const data = (await response.json()) as {
        token?: string
        user?: { email?: string; role?: 'admin' | 'staff' }
      }

      if (data.token) {
        window.sessionStorage.setItem('gym_token', data.token)
      }

      if (data.user) {
        window.sessionStorage.setItem('gym_user', JSON.stringify(data.user))
      }

      router.push('/clientes')
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
            logo={logo}
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
