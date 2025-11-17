'use client'

import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

interface DengueDataForm {
  state: string
  city: string
  cases: string
  deaths: string
  confirmedCases: string
  suspectedCases: string
  incidenceRate: string
}

export default function AdminPage() {
  const [formData, setFormData] = useState<DengueDataForm>({
    state: '',
    city: '',
    cases: '0',
    deaths: '0',
    confirmedCases: '0',
    suspectedCases: '0',
    incidenceRate: '0',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [states, setStates] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [loadingCities, setLoadingCities] = useState(false)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchStates()
  }, [])

  useEffect(() => {
    if (formData.state) {
      fetchCities(formData.state)
    } else {
      setCities([])
      setFormData({ ...formData, city: '' })
    }
  }, [formData.state])

  async function fetchStates() {
    try {
      const { data, error: fetchError } = await supabase
        .from('states')
        .select('*')
        .order('name')

      if (fetchError) {
        console.error('[Admin] Erro ao buscar estados:', fetchError)
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
        console.error('[Admin] Erro ao buscar cidades:', fetchError)
        return
      }
      setCities(data || [])
    } catch (err) {
      console.error('Erro ao buscar cidades:', err)
    } finally {
      setLoadingCities(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const today = new Date().toISOString().split('T')[0]

      // Check if record exists
      const { data: existing } = await supabase
        .from('dengue_cases')
        .select('id')
        .eq('state', formData.state.toUpperCase())
        .eq('city', formData.city)
        .eq('date', today)
        .single()

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('dengue_cases')
          .update({
            cases: parseInt(formData.cases),
            deaths: parseInt(formData.deaths),
            confirmed_cases: parseInt(formData.confirmedCases),
            suspected_cases: parseInt(formData.suspectedCases),
            incidence_rate: parseFloat(formData.incidenceRate),
            last_updated: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (error) throw error
        setMessage('Dados atualizados com sucesso!')
      } else {
        // Insert new record
        const { error } = await supabase
          .from('dengue_cases')
          .insert({
            state: formData.state.toUpperCase(),
            city: formData.city,
            cases: parseInt(formData.cases),
            deaths: parseInt(formData.deaths),
            confirmed_cases: parseInt(formData.confirmedCases),
            suspected_cases: parseInt(formData.suspectedCases),
            incidence_rate: parseFloat(formData.incidenceRate),
            date: today,
          })

        if (error) throw error
        setMessage('Dados adicionados com sucesso!')
      }

      setMessageType('success')
      setFormData({
        state: '',
        city: '',
        cases: '0',
        deaths: '0',
        confirmedCases: '0',
        suspectedCases: '0',
        incidenceRate: '0',
      })
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao salvar dados')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
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
          <nav className="flex gap-4">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Início
            </Link>
            <Link href="/mapa" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Mapa
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Painel Administrativo</h1>
        <p className="text-muted-foreground mb-6">
          Adicione ou atualize dados de casos de dengue por região
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Adicionar/Atualizar Dados de Dengue</CardTitle>
            <CardDescription>
              Preencha os campos abaixo para registrar novos dados de dengue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {message && (
                <Alert className={messageType === 'success' 
                  ? 'bg-green-100 border-green-200 dark:bg-green-900 dark:border-green-700'
                  : 'bg-destructive/10 border-destructive/20'
                }>
                  <AlertDescription className={messageType === 'success' ? 'text-green-800 dark:text-green-200' : 'text-destructive'}>
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Estado *</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    required
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
                  <label className="block text-sm font-medium mb-2">Cidade *</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    disabled={!formData.state || loadingCities}
                    required
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
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Dados de Casos</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Total de Casos</label>
                    <Input
                      type="number"
                      value={formData.cases}
                      onChange={(e) => setFormData({ ...formData, cases: e.target.value })}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Óbitos</label>
                    <Input
                      type="number"
                      value={formData.deaths}
                      onChange={(e) => setFormData({ ...formData, deaths: e.target.value })}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Casos Confirmados</label>
                    <Input
                      type="number"
                      value={formData.confirmedCases}
                      onChange={(e) => setFormData({ ...formData, confirmedCases: e.target.value })}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Casos Suspeitos</label>
                    <Input
                      type="number"
                      value={formData.suspectedCases}
                      onChange={(e) => setFormData({ ...formData, suspectedCases: e.target.value })}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Taxa de Incidência (por 100 mil hab)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.incidenceRate}
                  onChange={(e) => setFormData({ ...formData, incidenceRate: e.target.value })}
                  placeholder="0.0"
                  min="0"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Salvando...' : 'Salvar Dados'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({
                    state: '',
                    city: '',
                    cases: '0',
                    deaths: '0',
                    confirmedCases: '0',
                    suspectedCases: '0',
                    incidenceRate: '0',
                  })}
                >
                  Limpar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Como usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Selecione o estado e a cidade nos menus suspensos</p>
            <p>2. Insira os dados sobre casos de dengue naquela região</p>
            <p>3. Clique em "Salvar Dados" para registrar</p>
            <p>4. Se os dados de um mesmo estado e cidade já existirem para hoje, serão atualizados</p>
            <p className="text-xs mt-4 text-foreground font-semibold">
              Nota: Este é um painel de demonstração. Em produção, deve-se implementar autenticação e permissões de admin.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
