'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface State {
  name: string
  code: string
  cases: number
  deaths: number
  coords: { x: number; y: number }
}

const states: State[] = [
  { name: 'Amazonas', code: 'AM', cases: 1250, deaths: 3, coords: { x: 25, y: 15 } },
  { name: 'Roraima', code: 'RR', cases: 450, deaths: 1, coords: { x: 28, y: 5 } },
  { name: 'Pará', code: 'PA', cases: 2100, deaths: 8, coords: { x: 35, y: 18 } },
  { name: 'Maranhão', code: 'MA', cases: 1800, deaths: 5, coords: { x: 45, y: 22 } },
  { name: 'Tocantins', code: 'TO', cases: 920, deaths: 2, coords: { x: 42, y: 32 } },
  { name: 'Bahia', code: 'BA', cases: 4200, deaths: 15, coords: { x: 52, y: 48 } },
  { name: 'Minas Gerais', code: 'MG', cases: 3800, deaths: 12, coords: { x: 60, y: 52 } },
  { name: 'São Paulo', code: 'SP', cases: 5200, deaths: 18, coords: { x: 58, y: 62 } },
  { name: 'Rio de Janeiro', code: 'RJ', cases: 2400, deaths: 9, coords: { x: 68, y: 60 } },
  { name: 'Espírito Santo', code: 'ES', cases: 1600, deaths: 6, coords: { x: 72, y: 56 } },
  { name: 'Paraná', code: 'PR', cases: 1900, deaths: 7, coords: { x: 65, y: 72 } },
  { name: 'Rio Grande do Sul', code: 'RS', cases: 1400, deaths: 5, coords: { x: 60, y: 88 } },
  { name: 'Santa Catarina', code: 'SC', cases: 1100, deaths: 4, coords: { x: 67, y: 80 } },
  { name: 'Mato Grosso do Sul', code: 'MS', cases: 1300, deaths: 4, coords: { x: 42, y: 62 } },
  { name: 'Mato Grosso', code: 'MT', cases: 1050, deaths: 3, coords: { x: 40, y: 48 } },
  { name: 'Goiás', code: 'GO', cases: 1550, deaths: 5, coords: { x: 50, y: 55 } },
  { name: 'Distrito Federal', code: 'DF', cases: 850, deaths: 2, coords: { x: 52, y: 58 } },
  { name: 'Ceará', code: 'CE', cases: 2600, deaths: 10, coords: { x: 60, y: 28 } },
  { name: 'Pernambuco', code: 'PE', cases: 2200, deaths: 8, coords: { x: 65, y: 40 } },
  { name: 'Alagoas', code: 'AL', cases: 1100, deaths: 4, coords: { x: 68, y: 38 } },
]

const getColorByRisk = (cases: number): string => {
  if (cases > 4000) return 'bg-red-600'
  if (cases > 2500) return 'bg-orange-500'
  if (cases > 1500) return 'bg-yellow-500'
  if (cases > 500) return 'bg-yellow-300'
  return 'bg-green-400'
}

export default function InteractiveMap() {
  const [selectedState, setSelectedState] = useState<State | null>(null)

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mapa de Dengue no Brasil</CardTitle>
            <CardDescription>Clique em um estado para ver detalhes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 aspect-video flex items-center justify-center overflow-auto">
              <svg viewBox="0 0 100 100" className="w-full h-full max-h-96">
                {/* Map placeholder - simplified representation */}
                <rect x="0" y="0" width="100" height="100" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                
                {states.map((state) => (
                  <g key={state.code}>
                    <circle
                      cx={state.coords.x}
                      cy={state.coords.y}
                      r="2"
                      className={`${getColorByRisk(state.cases)} cursor-pointer transition-opacity hover:opacity-80 cursor-pointer`}
                      onClick={() => setSelectedState(state)}
                      style={{ filter: selectedState?.code === state.code ? 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' : 'none' }}
                    />
                    <text
                      x={state.coords.x}
                      y={state.coords.y - 4}
                      textAnchor="middle"
                      fontSize="1.5"
                      fontWeight="bold"
                      className="text-slate-700 dark:text-slate-300 cursor-pointer"
                      onClick={() => setSelectedState(state)}
                      style={{ pointerEvents: 'auto' }}
                    >
                      {state.code}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Legend */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-400"></div>
                <span className="text-xs">Baixo (&lt;500)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-300"></div>
                <span className="text-xs">Moderado (500-1500)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span className="text-xs">Alto (1500-2500)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <span className="text-xs">Crítico (&gt;4000)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedState ? `${selectedState.name}` : 'Selecione um Estado'}
            </CardTitle>
            <CardDescription>
              {selectedState ? selectedState.code : 'Clique em um estado no mapa'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedState ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Casos Confirmados</p>
                  <p className="text-3xl font-bold text-primary">{selectedState.cases.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Óbitos</p>
                  <p className="text-2xl font-bold text-destructive">{selectedState.deaths}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Taxa de Incidência</p>
                  <p className="text-lg font-semibold">
                    {((selectedState.cases / 1000) * 100).toFixed(1)}%
                  </p>
                </div>
                <Button className="w-full mt-6">Ver Mais Detalhes</Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Clique em um estado para visualizar dados detalhados de dengue
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
