'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Criar usuário no auth
      // Desabilitar confirmação de email para desenvolvimento
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          // Desabilitar confirmação de email (requer configuração no Supabase Dashboard)
          // Se ainda der erro, configure no Supabase: Authentication > Settings > Disable "Enable email confirmations"
        },
      })

      // IMPORTANTE: Só continuar se o usuário foi criado no auth
      if (!data?.user) {
        if (signUpError) {
          console.error('[v0] Erro ao criar usuário no auth:', {
            message: signUpError.message,
            status: signUpError.status,
            name: signUpError.name,
            error: signUpError
          })
          
          // Tratar erro de usuário já registrado
          if (signUpError.message?.includes('already registered') || 
              signUpError.message?.includes('User already registered') ||
              signUpError.message?.includes('already exists')) {
            throw new Error('Este email já está cadastrado. Tente fazer login ou use outro email. Se você deletou o usuário, pode ser necessário limpar o registro no Supabase (execute o script 07-cleanup-auth-users.sql).')
          }
          
          if (signUpError.message?.includes('Database error')) {
            throw new Error('Erro ao salvar usuário no banco de dados. Verifique se a estrutura da tabela users está correta (execute o script 04-fix-users-table-final.sql no Supabase).')
          }
          
          throw signUpError
        } else {
          throw new Error('Falha ao criar usuário. Tente novamente.')
        }
      }

      // Se houve erro mas o usuário foi criado (ex: erro de email), continuar
      if (signUpError) {
        console.warn('[v0] Usuário criado no auth mas houve erro:', signUpError.message)
        // Se for erro de email, continuar normalmente
        if (!signUpError.message?.includes('email') && !signUpError.message?.includes('Email')) {
          // Se não for erro de email, ainda assim pode ser um problema
          console.warn('[v0] Erro não relacionado a email, mas usuário foi criado. Continuando...')
        }
      }

      // Só criar na tabela users se o usuário foi criado no auth
      if (data?.user) {
        // Aguardar um pouco para garantir que o trigger tenha executado
        await new Promise(resolve => setTimeout(resolve, 500))

        // Verificar se o registro já existe na tabela users (pelo trigger)
        // Tentar com id primeiro
        let existingUser = null
        let checkError = null
        
        const { data: userById, error: errorById } = await supabase
          .from('users')
          .select('id, user_id')
          .eq('id', data.user.id)
          .maybeSingle()

        if (userById) {
          existingUser = userById
        } else if (errorById?.code !== 'PGRST116') {
          // Se não encontrou com id, tentar com user_id
          const { data: userByUserId, error: errorByUserId } = await supabase
            .from('users')
            .select('id, user_id')
            .eq('user_id', data.user.id)
            .maybeSingle()

          if (userByUserId) {
            existingUser = userByUserId
          } else {
            checkError = errorByUserId || errorById
          }
        } else {
          checkError = errorById
        }

        // Se não existir e não houver erro de permissão, tentar criar manualmente
        if (!existingUser && checkError?.code !== 'PGRST301') {
          // Tentar inserir apenas se o usuário estiver autenticado
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          console.log('[v0] Debug - Sessão após signUp:', {
            hasSession: !!session,
            userId: session?.user?.id,
            sessionError: sessionError ? JSON.stringify(sessionError, Object.getOwnPropertyNames(sessionError)) : null
          })
          
          if (session) {
            // Tentar inserir com id primeiro (estrutura padrão)
            let insertError = null
            let insertData = {
              id: data.user.id,
              email: data.user.email || email,
              full_name: fullName || data.user.user_metadata?.full_name || '',
            }

            console.log('[v0] Tentando inserir com dados:', insertData)
            
            const { data: insertedData, error: errorWithId } = await supabase
              .from('users')
              .insert(insertData)
              .select()

            if (errorWithId) {
              // Se falhar com id, tentar com user_id (estrutura alternativa)
              console.log('[v0] Tentativa com id falhou:', JSON.stringify(errorWithId, Object.getOwnPropertyNames(errorWithId)))
              
              const insertDataWithUserId = {
                user_id: data.user.id,
                email: data.user.email || email,
                full_name: fullName || data.user.user_metadata?.full_name || '',
              } as any

              console.log('[v0] Tentando inserir com user_id:', insertDataWithUserId)

              const { data: insertedDataUserId, error: errorWithUserId } = await supabase
                .from('users')
                .insert(insertDataWithUserId)
                .select()

              insertError = errorWithUserId
              
              if (!insertError && insertedDataUserId) {
                console.log('[v0] Sucesso ao inserir com user_id:', insertedDataUserId)
              }
            } else if (insertedData) {
              console.log('[v0] Sucesso ao inserir com id:', insertedData)
            }

            if (insertError) {
              // Tentar múltiplas formas de capturar o erro
              console.error('[v0] ========== ERRO AO CRIAR REGISTRO ==========')
              console.error('[v0] Tipo do erro:', typeof insertError)
              console.error('[v0] Erro é instância de Error?', insertError instanceof Error)
              console.error('[v0] Erro direto:', insertError)
              
              // Tentar acessar propriedades diretamente
              try {
                console.error('[v0] insertError.message:', insertError.message)
                console.error('[v0] insertError.code:', insertError.code)
                console.error('[v0] insertError.details:', insertError.details)
                console.error('[v0] insertError.hint:', insertError.hint)
                console.error('[v0] insertError.status:', (insertError as any).status)
              } catch (e) {
                console.error('[v0] Erro ao acessar propriedades:', e)
              }
              
              // Tentar serializar de diferentes formas
              try {
                const errorString = JSON.stringify(insertError, null, 2)
                console.error('[v0] Erro (JSON.stringify simples):', errorString)
              } catch (e) {
                console.error('[v0] Erro ao fazer JSON.stringify simples:', e)
              }
              
              try {
                const errorString2 = JSON.stringify(insertError, Object.getOwnPropertyNames(insertError), 2)
                console.error('[v0] Erro (JSON.stringify com getOwnPropertyNames):', errorString2)
              } catch (e) {
                console.error('[v0] Erro ao fazer JSON.stringify com getOwnPropertyNames:', e)
              }
              
              // Tentar usar Object.keys e mostrar valores individualmente
              try {
                const keys = Object.keys(insertError)
                console.error('[v0] Chaves do erro:', keys)
                
                // Mostrar cada valor individualmente de forma segura
                keys.forEach(key => {
                  try {
                    const value = (insertError as any)[key]
                    const valueType = typeof value
                    console.error(`[v0]   ${key}:`, valueType === 'object' ? JSON.stringify(value) : value, `(tipo: ${valueType})`)
                  } catch (e) {
                    console.error(`[v0]   ${key}: [Erro ao acessar]`, e)
                  }
                })
              } catch (e) {
                console.error('[v0] Erro ao usar Object.keys:', e)
              }
              
              // Tentar acessar propriedades comuns do Supabase
              const commonProps = ['message', 'code', 'details', 'hint', 'status', 'statusText', 'name']
              console.error('[v0] Propriedades comuns:')
              commonProps.forEach(prop => {
                try {
                  const value = (insertError as any)[prop]
                  if (value !== undefined) {
                    console.error(`[v0]   ${prop}:`, value)
                  }
                } catch (e) {
                  // Ignorar se não conseguir acessar
                }
              })
              
              console.error('[v0] ===========================================')
              
              // Não lançar erro aqui, pois o usuário já foi criado no auth
              // O dashboard tentará criar novamente quando o usuário fizer login
            } else {
              console.log('[v0] Registro criado com sucesso na tabela users')
            }
          } else {
            console.log('[v0] Usuário não autenticado ainda, o trigger ou o dashboard criará o registro')
            console.log('[v0] Erro de sessão:', sessionError ? JSON.stringify(sessionError, Object.getOwnPropertyNames(sessionError)) : 'Nenhum')
          }
        } else if (existingUser) {
          console.log('[v0] Registro já existe na tabela users (criado pelo trigger)')
        } else if (checkError?.code === 'PGRST301') {
          console.log('[v0] Erro de permissão ao verificar usuário (RLS bloqueando):', checkError)
        }

        setSuccess(true)
        setEmail('')
        setPassword('')
        setFullName('')
        
        setTimeout(() => {
          router.push('/auth/sign-in?message=Conta criada com sucesso! Faça login')
        }, 2000)
      }
    } catch (err) {
      console.error("[v0] Erro ao criar conta:", err)
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Criar Conta</CardTitle>
          <CardDescription>Cadastre-se para monitorar dengue na sua região</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <Alert className="bg-destructive/10 border-destructive/20">
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">Conta criada com sucesso! Redirecionando para login...</AlertDescription>
              </Alert>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Nome Completo
              </label>
              <Input
                id="name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome"
                required
              />
            </div>

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
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || success}>
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Já tem conta?{' '}
            <Link href="/auth/sign-in" className="text-primary hover:underline">
              Faça login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
