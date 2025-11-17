'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

interface UserData {
  id: string
  email: string
  full_name: string
  address: string
  city: string
  state: string
}

interface Alert {
  id: string
  state: string
  city: string | null
  alert_type: string
  threshold: number
  title: string
  description: string | null
  is_active: boolean
  priority: string
  last_triggered: string | null
  created_at: string
}

interface AlertHistory {
  id: string
  triggered_at: string
  cases_count: number
  alert_id: string
}

export default function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [formState, setFormState] = useState({
    address: '',
    city: '',
    state: '',
  })
  const [error, setError] = useState('')
  const [states, setStates] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [loadingCities, setLoadingCities] = useState(false)
  const [cityCases, setCityCases] = useState<{
    totalCases: number
    totalDeaths: number
    totalConfirmed: number
    period: string
  } | null>(null)
  const [loadingCases, setLoadingCases] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const fetchUserData = async (userId: string) => {
    try {
      // Tentar buscar com id primeiro
      let userData = null
      const { data: userById, error: errorById } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (userById) {
        userData = userById
      } else if (errorById?.code !== 'PGRST116') {
        // Se não encontrou com id, tentar com user_id
        const { data: userByUserId, error: errorByUserId } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (userByUserId) {
          userData = userByUserId
        } else if (errorByUserId && errorByUserId.code !== 'PGRST116') {
          console.error('[v0] Erro ao buscar usuário:', errorByUserId)
          throw errorByUserId
        }
      }

      if (!userData) {
        console.log('[v0] Usuário não encontrado na tabela users')
        return null
      }

      return userData
    } catch (err) {
      console.error('[v0] Erro em fetchUserData:', err)
      throw err
    }
  }

  const fetchAlerts = async (userState?: string, userCity?: string) => {
    try {
      // Buscar alertas ativos filtrados pela cidade/estado do usuário
      let query = supabase
        .from('alerts')
        .select('*')
        .eq('is_active', true)

      // Sempre filtrar pelo estado do usuário
      if (userState && userState.trim()) {
        query = query.eq('state', userState.toUpperCase().trim())
      } else {
        // Se não tem estado, retornar vazio
        return []
      }

      const { data: alertsData, error: alertsError } = await query
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (alertsError) {
        console.error('[v0] Erro ao buscar alertas:', {
          message: alertsError.message,
          code: alertsError.code,
          details: alertsError.details,
          hint: alertsError.hint
        })
        // Não lançar erro, retornar array vazio para não quebrar a página
        return []
      }

      // Filtrar por cidade no lado do cliente (se o usuário tem cidade cadastrada)
      // Mostrar alertas da cidade OU alertas do estado (sem cidade específica)
      if (userCity && userCity.trim() && alertsData) {
        return alertsData.filter((alert: Alert) => {
          // Se o alerta não tem cidade específica (null), mostrar (é alerta do estado)
          if (!alert.city) return true
          // Se o alerta tem cidade, mostrar apenas se for da cidade do usuário
          return alert.city.toLowerCase() === userCity.toLowerCase().trim()
        })
      }

      return alertsData || []
    } catch (err) {
      console.error('[v0] Erro ao buscar alertas:', err)
      // Retornar array vazio ao invés de lançar erro
      return []
    }
  }

  const fetchAlertHistory = async (alertIds: string[] = []) => {
    try {
      // Buscar histórico apenas dos alertas do usuário
      let query = supabase
        .from('alert_history')
        .select('*')

      // Se há IDs de alertas, filtrar por eles
      if (alertIds.length > 0) {
        query = query.in('alert_id', alertIds)
      } else {
        // Se não há alertas, retornar vazio
        return []
      }

      const { data: historyData, error: historyError } = await query
        .order('triggered_at', { ascending: false })
        .limit(10)

      if (historyError) {
        console.log('[v0] Erro ao buscar histórico de alertas:', historyError)
        return []
      }
      return historyData || []
    } catch (err) {
      console.log('[v0] Erro ao buscar histórico de alertas:', err)
      return []
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/auth/sign-in')
          return
        }

        // Verificar se há mensagem de sucesso na URL
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('alert') === 'created') {
          setError('')
          // Mostrar mensagem de sucesso temporariamente
          setTimeout(() => {
            // A mensagem será limpa automaticamente
          }, 3000)
        }

        // Fetch user data
        let userData = await fetchUserData(authUser.id)

        if (!userData) {
          console.log('[v0] Criando registro na tabela users para o usuário autenticado')
          
          // Tentar inserir com id primeiro
          let newUser = null
          const { data: userWithId, error: createErrorId } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || '',
            })
            .select()
            .single()

          if (userWithId) {
            newUser = userWithId
          } else if (createErrorId) {
            // Se falhar com id, tentar com user_id
            console.log('[v0] Tentativa com id falhou, tentando com user_id')
            const { data: userWithUserId, error: createErrorUserId } = await supabase
              .from('users')
              .insert({
                user_id: authUser.id,
                email: authUser.email || '',
                full_name: authUser.user_metadata?.full_name || '',
              } as any)
              .select()
              .single()

            if (userWithUserId) {
              newUser = userWithUserId
            } else if (createErrorUserId) {
              console.error('[v0] Erro ao criar registro na tabela users:', createErrorUserId)
              throw createErrorUserId
            }
          }

          if (!newUser) {
            throw new Error('Falha ao criar registro do usuário na tabela users')
          }
          
          userData = newUser
        }

        setUser(userData)
        setFormState({
          address: userData?.address || '',
          city: userData?.city || '',
          state: userData?.state || '',
        })

        // Fetch alerts and history (não bloquear se houver erro)
        try {
          // Buscar alertas filtrados pela cidade/estado do usuário
          const userAlerts = await fetchAlerts(userData?.state, userData?.city)
          setAlerts(userAlerts)

          // Filtrar histórico apenas dos alertas do usuário
          const alertIds = userAlerts.map((a: Alert) => a.id)
          const history = await fetchAlertHistory(alertIds)
          setAlertHistory(history)
          
          // Buscar casos do último mês da cidade do usuário
          if (userData?.city && userData?.state) {
            await fetchCityCases(userData.city, userData.state)
          }
        } catch (alertErr) {
          console.warn('[v0] Erro ao buscar alertas (não crítico):', alertErr)
          // Não bloquear a página se houver erro ao buscar alertas
          setAlerts([])
          setAlertHistory([])
        }
      } catch (err) {
        console.error('[v0] Erro geral no dashboard:', {
          error: err,
          message: err instanceof Error ? err.message : 'Erro desconhecido',
          stack: err instanceof Error ? err.stack : undefined
        })
        
        // Mensagem de erro mais detalhada
        let errorMessage = 'Erro ao carregar dados'
        if (err instanceof Error) {
          errorMessage = err.message
          // Adicionar mais contexto para erros comuns
          if (err.message.includes('row-level security')) {
            errorMessage = 'Erro de permissão. Verifique as políticas RLS no Supabase.'
          } else if (err.message.includes('relation') || err.message.includes('does not exist')) {
            errorMessage = 'Tabela não encontrada. Verifique se as tabelas foram criadas corretamente.'
          }
        }
        
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase, router])

  useEffect(() => {
    fetchStates()
  }, [])

  useEffect(() => {
    if (formState.state) {
      fetchCities(formState.state)
    } else {
      setCities([])
    }
  }, [formState.state])

  async function fetchStates() {
    try {
      const { data, error: fetchError } = await supabase
        .from('states')
        .select('*')
        .order('name')

      if (fetchError) {
        console.error('[Dashboard] Erro ao buscar estados:', fetchError)
        return
      }
      setStates(data || [])
    } catch (err) {
      console.error('Erro ao buscar estados:', err)
    }
  }

  async function fetchCities(stateCode: string) {
    try {
      setLoadingCities(true)
      const { data, error: fetchError } = await supabase
        .from('cities')
        .select('*')
        .eq('state_code', stateCode)
        .order('name')

      if (fetchError) {
        console.error('[Dashboard] Erro ao buscar cidades:', fetchError)
        return
      }
      setCities(data || [])
    } catch (err) {
      console.error('Erro ao buscar cidades:', err)
    } finally {
      setLoadingCities(false)
    }
  }

  async function fetchCityCases(userCity: string, userState: string) {
    if (!userCity || !userState) {
      setCityCases(null)
      return
    }

    try {
      setLoadingCases(true)
      
      // 1. Buscar código IBGE da cidade
      const { data: cityData, error: cityError } = await supabase
        .from('cities')
        .select('ibge_code')
        .eq('name', userCity)
        .eq('state_code', userState.toUpperCase())
        .limit(1)

      if (cityError || !cityData || cityData.length === 0) {
        console.warn('[Dashboard] Cidade não encontrada ou sem código IBGE:', userCity)
        setCityCases(null)
        return
      }

      const ibgeCode = cityData[0].ibge_code
      if (!ibgeCode) {
        setCityCases(null)
        return
      }

      // Truncar código IBGE para 6 dígitos
      const truncatedCode = ibgeCode.toString().trim().substring(0, 6)

      // 2. Calcular último mês
      const now = new Date()
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const startDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`
      const endDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-${String(new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate()).padStart(2, '0')}`

      // 3. Buscar casos do último mês
      const { data: casesData, error: casesError } = await supabase
        .from('dengue_cases')
        .select('cases, deaths, confirmed_cases')
        .eq('city', truncatedCode)
        .gte('date', startDate)
        .lte('date', endDate)

      if (casesError) {
        console.error('[Dashboard] Erro ao buscar casos:', casesError)
        setCityCases(null)
        return
      }

      if (!casesData || casesData.length === 0) {
        setCityCases({
          totalCases: 0,
          totalDeaths: 0,
          totalConfirmed: 0,
          period: `${String(lastMonth.getMonth() + 1).padStart(2, '0')}/${lastMonth.getFullYear()}`
        })
        return
      }

      // 4. Somar todos os casos
      const summary = {
        totalCases: casesData.reduce((sum, d) => sum + (Number(d.cases) || 0), 0),
        totalDeaths: casesData.reduce((sum, d) => sum + (Number(d.deaths) || 0), 0),
        totalConfirmed: casesData.reduce((sum, d) => sum + (Number(d.confirmed_cases) || 0), 0),
        period: `${String(lastMonth.getMonth() + 1).padStart(2, '0')}/${lastMonth.getFullYear()}`
      }

      setCityCases(summary)
    } catch (err) {
      console.error('[Dashboard] Erro ao buscar casos da cidade:', err)
      setCityCases(null)
    } finally {
      setLoadingCases(false)
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    try {
      // Tentar atualizar usando id primeiro
      let updateError = null
      const { error: errorWithId } = await supabase
        .from('users')
        .update(formState)
        .eq('id', user.id)

      if (errorWithId) {
        // Se falhar com id, tentar com user_id (se existir)
        if ((user as any).user_id) {
          const { error: errorWithUserId } = await supabase
            .from('users')
            .update(formState)
            .eq('user_id', (user as any).user_id)

          updateError = errorWithUserId
        } else {
          updateError = errorWithId
        }
      }

      if (updateError) {
        console.error('[v0] Erro ao atualizar perfil:', updateError)
        throw updateError
      }

      setUser({ ...user, ...formState })
      setError('')
      
      // Recarregar alertas com os novos dados de cidade/estado
      try {
        const userAlerts = await fetchAlerts(formState.state, formState.city)
        setAlerts(userAlerts)
        
        // Atualizar histórico
        const alertIds = userAlerts.map((a: Alert) => a.id)
        const history = await fetchAlertHistory(alertIds)
        setAlertHistory(history)
        
        // Recarregar casos do último mês
        if (formState.city && formState.state) {
          await fetchCityCases(formState.city, formState.state)
        } else {
          setCityCases(null)
        }
      } catch (alertErr) {
        console.warn('[v0] Erro ao recarregar alertas após atualização:', alertErr)
      }
      
      alert('Perfil atualizado com sucesso!')
    } catch (err) {
      console.error('[v0] Erro ao atualizar perfil:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil')
    }
  }



  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Carregando seus dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
              D
            </div>
            <h1 className="text-xl font-bold text-foreground">Dengue Alert</h1>
          </Link>
          <Button onClick={handleLogout} variant="outline">Sair</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {error && (
          <Alert className="mb-6 bg-destructive/10 border-destructive/20">
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('alert') === 'created' && (
          <Alert className="mb-6 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <AlertDescription className="text-green-800 dark:text-green-200">
              ✓ Alerta criado com sucesso!
            </AlertDescription>
          </Alert>
        )}

        {user && (
          <>
          {/* Casos do Último Mês - Ordem 1 em mobile e desktop */}
          {user?.city && user?.state && (
            <div className="mb-6 order-1">
              <Card>
                <CardHeader>
                  <CardTitle>Casos no Último Mês</CardTitle>
                  <CardDescription>
                    Dados de dengue para {user.city}, {user.state}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCases ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                      <p className="text-muted-foreground">Carregando dados...</p>
                    </div>
                  ) : cityCases ? (
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Total de Casos</p>
                        <p className="text-3xl font-bold text-primary">{cityCases.totalCases.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">Período: {cityCases.period}</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Casos Confirmados</p>
                        <p className="text-3xl font-bold text-accent">{cityCases.totalConfirmed.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">Período: {cityCases.period}</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Óbitos</p>
                        <p className="text-3xl font-bold text-destructive">{cityCases.totalDeaths.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">Período: {cityCases.period}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Nenhum dado disponível para {user.city} no último mês
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Profile Section - Ordem 3 em mobile, ordem 1 em desktop */}
            <div className="lg:col-span-1 order-3 lg:order-1">
              <Card className="lg:sticky lg:top-4">
                <CardHeader>
                  <CardTitle>Seu Perfil</CardTitle>
                  <CardDescription>Informações pessoais</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nome</label>
                      <Input
                        value={user.full_name}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <Input
                        value={user.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Endereço</label>
                      <Input
                        value={formState.address}
                        onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                        placeholder="Rua, número..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Estado</label>
                      <select
                        value={formState.state}
                        onChange={(e) => setFormState({ ...formState, state: e.target.value, city: '' })}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      >
                        <option value="">Selecione um estado</option>
                        {states.map((state) => (
                          <option key={state.code} value={state.code}>
                            {state.name} ({state.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Cidade</label>
                      <select
                        value={formState.city}
                        onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                        disabled={!formState.state || loadingCities}
                      >
                        <option value="">Selecione uma cidade</option>
                        {cities.map((city) => (
                          <option key={city.id} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                      {loadingCities && (
                        <p className="text-xs text-muted-foreground mt-1">Carregando cidades...</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full">
                      Salvar Alterações
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Alerts and History Section - Ordem 2 em mobile, ordem 2 em desktop */}
            <div className="lg:col-span-3 space-y-6 order-2 lg:order-2">
              {/* Active Alerts Section */}
              <div>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold">Alertas de Dengue</h2>
                  <p className="text-sm text-muted-foreground">
                    {!user?.state 
                      ? 'Cadastre seu estado e cidade no perfil para ver alertas personalizados'
                      : alerts.length > 0 
                        ? `${alerts.length} alerta(s) para ${user.city ? user.city + ', ' : ''}${user.state}`
                        : `Nenhum alerta ativo para ${user.city ? user.city + ', ' : ''}${user.state} no momento`}
                  </p>
                </div>

                {alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.map((alert) => {
                      const priorityColors = {
                        low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                        high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
                        critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }
                      const priorityLabels = {
                        low: 'Baixa',
                        medium: 'Média',
                        high: 'Alta',
                        critical: 'Crítica'
                      }
                      return (
                        <Card key={alert.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">{alert.title}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[alert.priority as keyof typeof priorityColors] || priorityColors.medium}`}>
                                  {priorityLabels[alert.priority as keyof typeof priorityLabels] || 'Média'}
                                </span>
                                {alert.is_active && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    Ativo
                                  </span>
                                )}
                              </div>
                              {alert.description && (
                                <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm flex-wrap">
                                <div>
                                  <span className="text-muted-foreground">Local: </span>
                                  <span className="font-medium">
                                    {alert.city ? `${alert.city}, ${alert.state}` : `Estado: ${alert.state}`}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Tipo: </span>
                                  <span className="font-medium">
                                    {alert.alert_type.replace(/_/g, ' ').charAt(0).toUpperCase() + alert.alert_type.replace(/_/g, ' ').slice(1)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Limite: </span>
                                  <span className="font-medium">{alert.threshold} casos</span>
                                </div>
                                {alert.last_triggered && (
                                  <div>
                                    <span className="text-muted-foreground">Última ativação: </span>
                                    <span className="font-medium">{new Date(alert.last_triggered).toLocaleDateString('pt-BR')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">Nenhum alerta ativo no momento.</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {alertHistory.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Histórico de Alertas Recentes</h2>
                  <div className="space-y-3">
                    {alertHistory.map((history) => (
                      <Card key={history.id} className="border-orange-200 dark:border-orange-900/30">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">!</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold">Alerta Disparado</p>
                              <p className="text-sm text-muted-foreground">
                                {history.cases_count} casos identificados
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(history.triggered_at).toLocaleDateString('pt-BR')} às {new Date(history.triggered_at).toLocaleTimeString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          </>
        )}
      </main>
    </div>
  )
}
