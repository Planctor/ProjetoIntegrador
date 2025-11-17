'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Importação dinâmica para evitar problemas de SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => {
    // Fix para ícones do Leaflet no Next.js
    if (typeof window !== 'undefined') {
      const L = require('leaflet')
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })
    }
    return mod.MapContainer
  }),
  { ssr: false }
)

const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface DengueCase {
  id: string
  state: string
  city: string // Código IBGE
  city_name?: string // Nome da cidade (buscado da tabela cities)
  cases: number
  deaths: number
  confirmed_cases: number
  suspected_cases: number
  incidence_rate: number
  date: string
}

interface StateCoordinates {
  code: string
  name: string
  lat: number
  lng: number
}

// Coordenadas aproximadas dos centros dos estados brasileiros
const stateCoordinates: StateCoordinates[] = [
  { code: 'AC', name: 'Acre', lat: -9.0238, lng: -70.8120 },
  { code: 'AL', name: 'Alagoas', lat: -9.5713, lng: -36.7820 },
  { code: 'AP', name: 'Amapá', lat: 1.4144, lng: -51.7860 },
  { code: 'AM', name: 'Amazonas', lat: -4.2634, lng: -65.2432 },
  { code: 'BA', name: 'Bahia', lat: -12.5797, lng: -41.7007 },
  { code: 'CE', name: 'Ceará', lat: -5.4984, lng: -39.3206 },
  { code: 'DF', name: 'Distrito Federal', lat: -15.7942, lng: -47.8822 },
  { code: 'ES', name: 'Espírito Santo', lat: -19.1834, lng: -40.3089 },
  { code: 'GO', name: 'Goiás', lat: -16.6864, lng: -49.2643 },
  { code: 'MA', name: 'Maranhão', lat: -4.9609, lng: -45.2744 },
  { code: 'MT', name: 'Mato Grosso', lat: -12.6819, lng: -56.9211 },
  { code: 'MS', name: 'Mato Grosso do Sul', lat: -20.7722, lng: -54.7852 },
  { code: 'MG', name: 'Minas Gerais', lat: -18.5122, lng: -44.5550 },
  { code: 'PA', name: 'Pará', lat: -5.5277, lng: -52.0295 },
  { code: 'PB', name: 'Paraíba', lat: -7.2400, lng: -36.7820 },
  { code: 'PR', name: 'Paraná', lat: -24.8934, lng: -51.4250 },
  { code: 'PE', name: 'Pernambuco', lat: -8.8137, lng: -36.9541 },
  { code: 'PI', name: 'Piauí', lat: -8.8137, lng: -42.2908 },
  { code: 'RJ', name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
  { code: 'RN', name: 'Rio Grande do Norte', lat: -5.4026, lng: -36.9541 },
  { code: 'RS', name: 'Rio Grande do Sul', lat: -30.0346, lng: -51.2177 },
  { code: 'RO', name: 'Rondônia', lat: -11.5057, lng: -63.5806 },
  { code: 'RR', name: 'Roraima', lat: 1.4144, lng: -61.4441 },
  { code: 'SC', name: 'Santa Catarina', lat: -27.2423, lng: -50.2189 },
  { code: 'SP', name: 'São Paulo', lat: -23.5505, lng: -46.6333 },
  { code: 'SE', name: 'Sergipe', lat: -10.5741, lng: -37.3857 },
  { code: 'TO', name: 'Tocantins', lat: -10.1753, lng: -48.2982 },
]

export default function DengueMap() {
  const [selectedState, setSelectedState] = useState<StateCoordinates | null>(null)
  const [dengueData, setDengueData] = useState<DengueCase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stateSummary, setStateSummary] = useState<any>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const supabase = getSupabaseBrowserClient()

  const center: [number, number] = [-14.2350, -51.9253] // Centro do Brasil
  const zoom = 5

  useEffect(() => {
    // Só buscar dados se tiver estado selecionado E ano E mês selecionados
    if (selectedState && selectedYear && selectedMonth) {
      fetchDengueData(selectedState.code)
    } else if (selectedState) {
      // Se selecionou estado mas não tem data, limpar dados
      setDengueData([])
      setStateSummary(null)
      setLoading(false)
    }
  }, [selectedState, selectedMonth, selectedYear])

  async function fetchDengueData(stateCode: string) {
    try {
      setLoading(true)
      setError('')

      // 1. Primeiro, buscar todas as cidades do estado para obter seus códigos IBGE
      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('ibge_code, name, state_code')
        .eq('state_code', stateCode.toUpperCase())
      
      if (citiesError) throw citiesError

      if (!citiesData || citiesData.length === 0) {
        setDengueData([])
        setStateSummary(null)
        setLoading(false)
        return
      }

      // 2. Extrair códigos IBGE das cidades do estado e garantir que estão truncados para 6 dígitos
      const ibgeCodes = citiesData
        .map(c => {
          if (!c.ibge_code) return null
          // Garantir que o código IBGE tem no máximo 6 dígitos
          const code = c.ibge_code.toString().trim()
          return code.substring(0, 6)
        })
        .filter(Boolean) as string[]
      
      // Criar mapa de código IBGE -> nome da cidade (usando código truncado)
      const cityNameMap = new Map<string, string>()
      citiesData.forEach(city => {
        if (city.ibge_code) {
          const truncatedCode = city.ibge_code.toString().trim().substring(0, 6)
          cityNameMap.set(truncatedCode, city.name)
        }
      })

      console.log(`[Mapa] Buscando dados para estado ${stateCode}:`, {
        totalCidades: citiesData.length,
        codigosIBGE: ibgeCodes.length,
        exemplosCodigos: ibgeCodes.slice(0, 5)
      })

      // 3. Buscar dados de dengue usando os códigos IBGE (city contém código IBGE)
      // OTIMIZAÇÃO: Aplicar filtros de data diretamente na query SQL
      // NOTA: Não filtrar por state porque pode estar inconsistente, buscar apenas por código IBGE
      let query = supabase
        .from('dengue_cases')
        .select('*')
        .in('city', ibgeCodes)
      
      // Aplicar filtro de período - agora é obrigatório ter ano E mês
      if (!selectedYear || !selectedMonth) {
        setDengueData([])
        setStateSummary(null)
        setLoading(false)
        return
      }
      
      const year = parseInt(selectedYear)
      const month = parseInt(selectedMonth)
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      
      console.log(`[Mapa] Filtro de data:`, { startDate, endDate, periodo: `${month}/${year}` })
      
      query = query
        .gte('date', startDate)
        .lte('date', endDate)
      
      // Ordenar por data (mais recente primeiro) e buscar
      query = query.order('date', { ascending: false })
      
      // Buscar dados (com limite razoável para não sobrecarregar)
      // Se precisar de mais dados, podemos aumentar o limite ou usar paginação
      const { data, error: fetchError } = await query.limit(50000) // Limite de 50k registros
      
      if (fetchError) {
        console.error('[Mapa] Erro na query:', fetchError)
        throw fetchError
      }
      
      console.log(`[Mapa] Dados retornados do banco:`, {
        total: data?.length || 0,
        exemplos: data?.slice(0, 3).map(d => ({
          city: d.city,
          state: d.state,
          date: d.date,
          cases: d.cases
        }))
      })

      // 4. Adicionar nome da cidade aos dados de dengue
      // Os dados já vêm filtrados do banco, não precisamos filtrar novamente
      if (data && data.length > 0) {
        // Garantir que os códigos IBGE dos dados também estão truncados para 6 dígitos
        const dataWithCityNames = data.map(d => {
          // Truncar código IBGE do registro para 6 dígitos para fazer match
          const cityCode = d.city ? d.city.toString().trim().substring(0, 6) : d.city
          return {
            ...d,
            city: cityCode, // Garantir que está truncado
            city_name: cityNameMap.get(cityCode) || cityCode, // Usa código IBGE se não encontrar nome
            // Manter o state original do banco (pode estar inconsistente, mas não importa)
            state: d.state || stateCode.toUpperCase(),
          }
        })
        
        // Calcular totais somando TODOS os casos de TODOS os registros retornados
        // (já filtrados pelo banco de dados)
        const summary = {
          totalCases: dataWithCityNames.reduce((sum, d) => sum + (Number(d.cases) || 0), 0),
          totalDeaths: dataWithCityNames.reduce((sum, d) => sum + (Number(d.deaths) || 0), 0),
          totalConfirmed: dataWithCityNames.reduce((sum, d) => sum + (Number(d.confirmed_cases) || 0), 0),
          totalSuspected: dataWithCityNames.reduce((sum, d) => sum + (Number(d.suspected_cases) || 0), 0),
          cities: new Set(dataWithCityNames.map(d => d.city)).size, // Contar cidades únicas
          period: `${String(selectedMonth).padStart(2, '0')}/${selectedYear}`,
        }
        
        // Debug: verificar cálculo
        console.log(`[Mapa] Resumo:`, {
          estado: stateCode,
          periodo: summary.period,
          cidades: summary.cities,
          totalCasos: summary.totalCases,
          registrosRetornados: dataWithCityNames.length,
          exemplos: dataWithCityNames.slice(0, 3).map(d => ({ 
            cidade: d.city_name || d.city, 
            data: d.date,
            casos: d.cases 
          }))
        })
        
        setStateSummary(summary)
        setDengueData(dataWithCityNames) // Mostrar TODOS os registros retornados (já filtrados)
      } else {
        setDengueData([])
        setStateSummary(null)
      }
    } catch (err) {
      console.error('Erro ao buscar dados de dengue:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados')
      setDengueData([])
      setStateSummary(null)
    } finally {
      setLoading(false)
    }
  }

  function handleMarkerClick(state: StateCoordinates) {
    setSelectedState(state)
  }

  function getRiskColor(cases: number): string {
    if (cases > 1000) return 'red'
    if (cases > 500) return 'orange'
    if (cases > 100) return 'yellow'
    return 'green'
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">Mapa de Casos de Dengue no Brasil</h3>
          <p className="text-sm text-muted-foreground">
            Selecione o mês e ano, depois clique em um estado para ver os dados detalhados
          </p>
        </div>
        {selectedState && (
          <button
            onClick={() => {
              setSelectedState(null)
              setDengueData([])
              setStateSummary(null)
            }}
            className="text-sm text-primary hover:underline"
          >
            Limpar seleção
          </button>
        )}
      </div>

      {/* Filtro de período - obrigatório */}
      <div className="mb-4 p-4 bg-muted/50 rounded-lg border-2 border-primary/20">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">
              Selecionar Período <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Selecione o mês e ano para visualizar os dados do mapa
            </p>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background text-sm"
                required
              >
                <option value="">Selecione o mês</option>
                <option value="1">Janeiro</option>
                <option value="2">Fevereiro</option>
                <option value="3">Março</option>
                <option value="4">Abril</option>
                <option value="5">Maio</option>
                <option value="6">Junho</option>
                <option value="7">Julho</option>
                <option value="8">Agosto</option>
                <option value="9">Setembro</option>
                <option value="10">Outubro</option>
                <option value="11">Novembro</option>
                <option value="12">Dezembro</option>
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background text-sm"
                required
              >
                <option value="">Selecione o ano</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - i
                  return (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  )
                })}
              </select>
              {(selectedMonth || selectedYear) && (
                <button
                  onClick={() => {
                    setSelectedMonth('')
                    setSelectedYear('')
                    setSelectedState(null)
                    setDengueData([])
                    setStateSummary(null)
                  }}
                  className="px-3 py-2 text-sm border rounded-md hover:bg-muted"
                >
                  Limpar
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedMonth && selectedYear 
                ? `Dados de ${new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
                : 'Selecione mês e ano para visualizar os dados'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert className="bg-destructive/10 border-destructive/20">
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative" style={{ height: '600px', width: '100%' }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {stateCoordinates.map((state) => {
            // Buscar dados do estado (pode ter múltiplos registros por cidade/data)
            const stateDataList = dengueData.filter(d => d.state === state.code)
            // Pegar o total de casos do registro mais recente
            const latestStateData = stateDataList.length > 0 
              ? stateDataList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
              : null
            const cases = latestStateData?.cases || 0
            
            return (
              <Marker
                key={state.code}
                position={[state.lat, state.lng]}
                eventHandlers={{
                  click: () => handleMarkerClick(state),
                }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <h4 className="font-bold text-lg mb-2">{state.name} ({state.code})</h4>
                    {latestStateData ? (
                      <div className="space-y-1 text-sm">
                        <p><strong>Casos:</strong> {latestStateData.cases.toLocaleString()}</p>
                        <p><strong>Confirmados:</strong> {latestStateData.confirmed_cases.toLocaleString()}</p>
                        <p><strong>Óbitos:</strong> {latestStateData.deaths}</p>
                        <p><strong>Data:</strong> {new Date(latestStateData.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Clique para ver dados detalhados</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      {loading && (
        <div className="text-center py-4">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      )}

      {selectedState && stateSummary && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>{selectedState.name} - Resumo</CardTitle>
            <CardDescription>
              Período: {stateSummary.period}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Total de Casos</p>
                <p className="text-2xl font-bold text-primary">{stateSummary.totalCases.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Casos Confirmados</p>
                <p className="text-2xl font-bold text-accent">{stateSummary.totalConfirmed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Total de Óbitos</p>
                <p className="text-2xl font-bold text-destructive">{stateSummary.totalDeaths}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Cidades com Dados</p>
                <p className="text-2xl font-bold">{stateSummary.cities}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Período: {stateSummary.period}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedState && dengueData.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Cidades de {selectedState.name}</CardTitle>
            <CardDescription>
              {stateSummary?.cities || 0} cidades com dados disponíveis no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {dengueData
                .sort((a, b) => {
                  // Ordenar por data (mais recente primeiro) e depois por casos
                  const dateCompare = b.date.localeCompare(a.date)
                  if (dateCompare !== 0) return dateCompare
                  return (b.cases || 0) - (a.cases || 0)
                })
                .map((data) => (
                    <div
                      key={`${data.city}-${data.date}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{data.city_name || data.city}</h4>
                        {data.city_name && data.city_name !== data.city && (
                          <p className="text-xs text-muted-foreground">IBGE: {data.city}</p>
                        )}
                        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                          <span>Casos: {data.cases.toLocaleString()}</span>
                          <span>Confirmados: {data.confirmed_cases.toLocaleString()}</span>
                          <span>Óbitos: {data.deaths}</span>
                          {data.incidence_rate && (
                            <span>Incidência: {data.incidence_rate.toFixed(2)}%</span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full ${
                          getRiskColor(data.cases) === 'red' ? 'bg-red-500' :
                          getRiskColor(data.cases) === 'orange' ? 'bg-orange-500' :
                          getRiskColor(data.cases) === 'yellow' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                      />
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedState && !selectedYear && !selectedMonth && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Selecione um período</CardTitle>
            <CardDescription>
              Selecione o mês e ano acima para visualizar os dados de {selectedState.name}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {selectedState && selectedYear && selectedMonth && dengueData.length === 0 && !loading && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Nenhum dado encontrado</CardTitle>
            <CardDescription>
              Não há dados de dengue disponíveis para {selectedState.name} no período selecionado
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}

