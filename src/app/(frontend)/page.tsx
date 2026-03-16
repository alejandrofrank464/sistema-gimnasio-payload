'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dumbbell, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
    <div className="bg-background relative grid min-h-screen place-items-center overflow-hidden px-4">
      <div className="bg-primary/15 pointer-events-none absolute inset-x-0 top-[-20%] h-[40%] blur-3xl" />
      <Card className="border-border/80 bg-card/95 w-full max-w-md shadow-xl backdrop-blur">
        <CardHeader className="gap-2">
          <div className="text-primary mb-1 flex items-center gap-2">
            <Dumbbell className="size-5" />
            <span className="text-sm font-medium">GymOS</span>
          </div>
          <CardTitle className="text-2xl">Iniciar Sesion</CardTitle>
          <CardDescription>
            Accede con tu usuario de Payload para gestionar el gimnasio.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              <ShieldCheck data-icon="inline-start" />
              {submitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
