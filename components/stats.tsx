'use client'

import { Card, CardContent } from '@/components/ui/card'

export default function Stats() {
  const stats = [
    { label: 'Casos Totais', value: '48,370', icon: '📈' },
    { label: 'Óbitos', value: '142', icon: '⚠️' },
    { label: 'Estados Afetados', value: '27', icon: '🗺️' },
    { label: 'Taxa de Incidência', value: '23.5%', icon: '📊' },
  ]

  return (
    <section className="py-12 bg-card/50 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{stat.icon}</span>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
