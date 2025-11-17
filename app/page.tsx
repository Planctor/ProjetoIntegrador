'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DengueMap from '@/components/dengue-map'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'

export default function Home() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Verificar se o usuário está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
      } catch (err) {
        setIsAuthenticated(false)
      }
    }
    
    checkAuth()

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
              D
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-primary">DENGUE</h1>
              <p className="text-xs text-muted-foreground">Monitoramento</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#mapa" 
              className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                const mapaSection = document.getElementById('mapa')
                if (mapaSection) {
                  mapaSection.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            >
              Mapa
            </a>
            <Link href="/sobre" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Sobre
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Dashboard
              </Link>
            ) : (
              <Link href="/auth/sign-in" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Login
              </Link>
            )}
            {!isAuthenticated && (
              <Link href="/auth/sign-up">
                <Button size="sm" className="bg-primary hover:bg-primary/90">Criar Conta</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-primary py-20 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1200 600" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <circle cx="25" cy="25" r="2" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="1200" height="600" fill="url(#dots)" />
          </svg>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-5xl sm:text-6xl font-bold text-white leading-tight">
                Impacto no Brasil
              </h2>
              <p className="text-lg text-white/90">
                Monitore casos de dengue em tempo real, visualize estatísticas por região e receba alertas personalizados para proteger sua saúde.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a 
                  href="#mapa"
                  onClick={(e) => {
                    e.preventDefault()
                    const mapaSection = document.getElementById('mapa')
                    if (mapaSection) {
                      mapaSection.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                >
                  <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 font-semibold">
                    Explorar Mapa
                  </Button>
                </a>
                <Link href="/auth/sign-up">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 font-semibold">
                    Ativar Alertas
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="w-64 h-64 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-40 h-40 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section id="mapa" className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Distribuição de Casos
            </h2>
            <p className="text-lg text-muted-foreground">
              Visualize o impacto da dengue em cada estado do Brasil
            </p>
          </div>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <DengueMap />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Recursos Principais
            </h2>
            <p className="text-lg text-muted-foreground">
              Ferramentas para proteger sua saúde
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-8 border border-border hover:border-primary/50 transition-colors shadow-sm">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-xl font-bold text-foreground mb-3">Mapa Interativo</h3>
              <p className="text-muted-foreground">
                Visualize casos de dengue em cada estado e cidade do Brasil com dados atualizados.
              </p>
            </div>

            <div className="bg-card rounded-lg p-8 border border-border hover:border-primary/50 transition-colors shadow-sm">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-foreground mb-3">Estatísticas</h3>
              <p className="text-muted-foreground">
                Confira dados sobre casos confirmados, óbitos e tendências por região.
              </p>
            </div>

            <div className="bg-card rounded-lg p-8 border border-border hover:border-primary/50 transition-colors shadow-sm">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-xl font-bold text-foreground mb-3">Alertas Personalizados</h3>
              <p className="text-muted-foreground">
                Configure alertas para sua região e receba notificações de aumentos de casos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
            Comece a Monitorar Agora
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Crie sua conta e configure alertas personalizados para sua localização
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
              Criar Conta Gratuita
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-foreground mb-4">Dengue Alert</h4>
              <p className="text-sm text-muted-foreground">Monitoramento de dengue no Brasil</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#mapa" className="hover:text-foreground" onClick={(e) => {
                  e.preventDefault()
                  const mapaSection = document.getElementById('mapa')
                  if (mapaSection) {
                    mapaSection.scrollIntoView({ behavior: 'smooth' })
                  }
                }}>Mapa</a></li>
                <li><Link href="/sobre" className="hover:text-foreground">Sobre</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacidade</a></li>
                <li><a href="#" className="hover:text-foreground">Termos</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">Contato</h4>
              <p className="text-sm text-muted-foreground">info@denguealert.com</p>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>Dengue Alert - Monitoramento de Dengue no Brasil</p>
            <p className="text-xs mt-2">Dados para fins informativos. Consulte autoridades de saúde para informações oficiais.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
