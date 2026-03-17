'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dumbbell, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export function LoginForm({
  className,
  logo,
  email,
  password,
  error,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  submitting,
  ...props
}: React.ComponentProps<'div'> & {
  logo?: string
  email?: string
  password?: string
  error?: string | null
  onEmailChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPasswordChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit?: (e: React.FormEvent) => Promise<void>
  submitting?: boolean
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={onSubmit} className="p-6 md:p-8">
            <FieldGroup className="gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">Login to your staff account</p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={onEmailChange}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={onPasswordChange}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Field>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Entrando...' : 'Login'}
                </Button>
              </Field>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden flex-col items-center justify-center gap-6 md:flex">
            {/* Título GYM OS */}
            <div className="flex items-center gap-2">
              <Dumbbell className="size-6 text-blue-500" />
              <span className="text-foreground text-2xl font-bold">GYM OS</span>
            </div>

            {/* Avatar circular con imagen */}
            <div className="relative">
              <img
                src={logo || '/placeholder.svg'}
                alt="Logo"
                className="h-48 w-48 rounded-full object-cover shadow-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
