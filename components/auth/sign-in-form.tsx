'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export default function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const supabase = getSupabaseBrowserClient()

  // Verificar se o usuário já está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Usuário já está autenticado, redirecionar para dashboard
          router.push('/dashboard')
        }
      } catch (err) {
        // Erro ao verificar autenticação, continuar na página de login
        console.log('Verificando autenticação...')
      }
    }
    
    checkAuth()
  }, [router, supabase])

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (!signInData?.user) {
        throw new Error('Falha ao autenticar usuário')
      }

      // Verificar se o usuário existe na tabela users
      // Tentar com id primeiro
      let userData = null
      const { data: userById, error: errorById } = await supabase
        .from('users')
        .select('id, user_id, email, full_name')
        .eq('id', signInData.user.id)
        .maybeSingle()

      if (userById) {
        userData = userById
      } else if (errorById?.code !== 'PGRST116') {
        // Se não encontrou com id, tentar com user_id
        const { data: userByUserId, error: errorByUserId } = await supabase
          .from('users')
          .select('id, user_id, email, full_name')
          .eq('user_id', signInData.user.id)
          .maybeSingle()

        if (userByUserId) {
          userData = userByUserId
        } else if (errorByUserId && errorByUserId.code !== 'PGRST116') {
          console.error('[v0] Erro ao verificar usuário:', errorByUserId)
          throw new Error('Erro ao verificar dados do usuário')
        }
      }

      // Se o usuário não existe na tabela users, criar automaticamente
      if (!userData) {
        console.log('[v0] Usuário autenticado mas não encontrado na tabela users. Criando registro...')
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: signInData.user.id,
            email: signInData.user.email || '',
            full_name: signInData.user.user_metadata?.full_name || '',
          })
          .select()
          .single()

        if (createError) {
          // Se falhar com id, tentar com user_id
          const { error: createErrorUserId } = await supabase
            .from('users')
            .insert({
              user_id: signInData.user.id,
              email: signInData.user.email || '',
              full_name: signInData.user.user_metadata?.full_name || '',
            } as any)

          if (createErrorUserId) {
            console.error('[v0] Erro ao criar registro na tabela users:', createErrorUserId)
            // Não bloquear o login, apenas logar o erro
            // O dashboard tentará criar novamente
          } else {
            console.log('[v0] Registro criado com sucesso usando user_id')
          }
        } else {
          console.log('[v0] Registro criado com sucesso na tabela users')
        }
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Fazer Login</CardTitle>
          <CardDescription>Acesse sua conta para monitorar dengue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            {message && (
              <Alert className="bg-primary/10 border-primary/20">
                <AlertDescription className="text-primary">{message}</AlertDescription>
              </Alert>
            )}
            
            {error && (
              <Alert className="bg-destructive/10 border-destructive/20">
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Fazer Login'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Não tem conta?{' '}
            <Link href="/auth/sign-up" className="text-primary hover:underline">
              Crie uma agora
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
