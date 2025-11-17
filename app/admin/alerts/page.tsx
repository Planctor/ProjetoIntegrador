'use client'

import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

interface AlertData {
  id?: string
  state: string
  city: string
  alert_type: string
  threshold: number
  title: string
  description: string
  is_active: boolean
  priority: string
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingAlert, setEditingAlert] = useState<any | null>(null)
  const [formData, setFormData] = useState<AlertData>({
    state: '',
    city: '',
    alert_type: 'case_increase',
    threshold: 100,
    title: '',
    description: '',
    is_active: true,
    priority: 'medium'
  })
  const [states, setStates] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [loadingCities, setLoadingCities] = useState(false)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchAlerts()
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

  async function fetchAlerts() {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('[Admin] Erro ao buscar alertas:', {
          message: fetchError.message,
          code: fetchError.code,
          details: fetchError.details,
          hint: fetchError.hint
        })
        throw fetchError
      }
      setAlerts(data || [])
    } catch (err) {
      console.error('Erro ao buscar alertas:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar alertas')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validação básica
    if (!formData.title.trim()) {
      setError('O título é obrigatório')
      return
    }
    if (!formData.state.trim()) {
      setError('O estado é obrigatório')
      return
    }
    if (!formData.alert_type) {
      setError('O tipo de alerta é obrigatório')
      return
    }
    if (!formData.threshold || formData.threshold < 1) {
      setError('O limite de casos deve ser maior que zero')
      return
    }

    try {
      // Preparar dados: converter string vazia para null em campos opcionais
      const dataToSave: any = {
        state: formData.state.trim().toUpperCase(),
        city: formData.city.trim() || null,
        alert_type: formData.alert_type,
        threshold: formData.threshold,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        is_active: formData.is_active,
        priority: formData.priority
      }

      // Adicionar updated_at apenas na atualização
      if (editingAlert) {
        dataToSave.updated_at = new Date().toISOString()
      }

      if (editingAlert) {
        // Atualizar alerta existente - remover campos que não devem ser atualizados
        delete dataToSave.id
        const { data, error: updateError } = await supabase
          .from('alerts')
          .update(dataToSave)
          .eq('id', editingAlert.id)
          .select()

        if (updateError) {
          console.error('[Admin] Erro ao atualizar alerta:', {
            message: updateError.message,
            code: updateError.code,
            details: updateError.details,
            hint: updateError.hint,
            alertId: editingAlert.id,
            dataToSave
          })
          throw updateError
        }
        console.log('[Admin] Alerta atualizado com sucesso:', data)
      } else {
        // Criar novo alerta
        const { data, error: insertError } = await supabase
          .from('alerts')
          .insert([dataToSave])
          .select()

        if (insertError) {
          console.error('[Admin] Erro ao criar alerta:', {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
            dataToSave
          })
          throw insertError
        }
        console.log('[Admin] Alerta criado com sucesso:', data)
      }

      setShowForm(false)
      setEditingAlert(null)
      setFormData({
        state: '',
        city: '',
        alert_type: 'case_increase',
        threshold: 100,
        title: '',
        description: '',
        is_active: true,
        priority: 'medium'
      })
      await fetchAlerts()
    } catch (err) {
      console.error('[Admin] Erro ao salvar alerta:', err)
      let errorMessage = 'Erro ao salvar alerta'
      if (err instanceof Error) {
        errorMessage = err.message
        // Mensagens mais específicas
        if (err.message.includes('row-level security') || err.message.includes('RLS')) {
          errorMessage = 'Erro de permissão. Verifique as políticas RLS no Supabase.'
        } else if (err.message.includes('foreign key')) {
          errorMessage = 'Erro de referência. Verifique os dados inseridos.'
        } else if (err.message.includes('null value') || err.message.includes('NOT NULL')) {
          errorMessage = 'Campos obrigatórios não preenchidos.'
        }
      }
      setError(errorMessage)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja deletar este alerta?')) return

    try {
      const { error: deleteError } = await supabase
        .from('alerts')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      await fetchAlerts()
    } catch (err) {
      console.error('Erro ao deletar alerta:', err)
      setError(err instanceof Error ? err.message : 'Erro ao deletar alerta')
    }
  }

  async function handleEdit(alert: any) {
    setEditingAlert(alert)
    setFormData({
      state: alert.state,
      city: alert.city || '',
      alert_type: alert.alert_type,
      threshold: alert.threshold,
      title: alert.title,
      description: alert.description || '',
      is_active: alert.is_active,
      priority: alert.priority
    })
    // Carregar cidades do estado selecionado
    if (alert.state) {
      await fetchCities(alert.state)
    }
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingAlert(null)
    setFormData({
      state: '',
      city: '',
      alert_type: 'case_increase',
      threshold: 100,
      title: '',
      description: '',
      is_active: true,
      priority: 'medium'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Carregando alertas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
              D
            </div>
            <h1 className="text-xl font-bold text-foreground">Dengue Alert - Administração</h1>
          </Link>
          <Link href="/">
            <Button variant="outline">Voltar ao Início</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Gerenciar Alertas</h1>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>+ Novo Alerta</Button>
          )}
        </div>

        {error && (
          <Alert className="mb-6 bg-destructive/10 border-destructive/20">
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingAlert ? 'Editar Alerta' : 'Criar Novo Alerta'}</CardTitle>
              <CardDescription>
                {editingAlert ? 'Atualize as informações do alerta' : 'Preencha os dados para criar um novo alerta'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Título *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Alerta de Dengue - São Paulo"
                      required
                    />
                  </div>
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
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição detalhada do alerta..."
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground min-h-[100px]"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Cidade (Opcional)</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      disabled={!formData.state || loadingCities}
                    >
                      <option value="">Todas as cidades do estado</option>
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
                  <div>
                    <label className="block text-sm font-medium mb-2">Tipo de Alerta *</label>
                    <select
                      value={formData.alert_type}
                      onChange={(e) => setFormData({ ...formData, alert_type: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      required
                    >
                      <option value="case_increase">Aumento de Casos</option>
                      <option value="outbreak">Surto Detectado</option>
                      <option value="warning">Alerta de Saúde</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Limite de Casos *</label>
                    <Input
                      type="number"
                      value={formData.threshold}
                      onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) || 0 })}
                      placeholder="100"
                      min="10"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Prioridade *</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      required
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="critical">Crítica</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">Ativo</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingAlert ? 'Atualizar' : 'Criar'} Alerta
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

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
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{alert.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[alert.priority as keyof typeof priorityColors] || priorityColors.medium}`}>
                          {priorityLabels[alert.priority as keyof typeof priorityLabels] || 'Média'}
                        </span>
                        {alert.is_active ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Ativo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                            Inativo
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
                        <div>
                          <span className="text-muted-foreground">Criado em: </span>
                          <span className="font-medium">{new Date(alert.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(alert)}
                        variant="outline"
                        size="sm"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleDelete(alert.id)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Deletar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {alerts.length === 0 && !showForm && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">Nenhum alerta cadastrado.</p>
              <Button onClick={() => setShowForm(true)}>Criar primeiro alerta</Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}


