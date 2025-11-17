import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
              D
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-primary">DENGUE</h1>
              <p className="text-xs text-muted-foreground">Monitoramento</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="/#mapa" 
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Mapa
            </a>
            <Link href="/sobre" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Sobre
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/sign-in" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Login
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm" className="bg-primary hover:bg-primary/90">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
              Sobre o Dengue Alert
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma dedicada ao monitoramento e alerta de casos de dengue no Brasil
            </p>
          </div>

          {/* Mission Card */}
          <Card>
            <CardHeader>
              <CardTitle>Nossa Missão</CardTitle>
              <CardDescription>
                Informar e proteger a população brasileira
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                O Dengue Alert foi criado com o objetivo de fornecer informações atualizadas e precisas sobre 
                casos de dengue em todo o território brasileiro. Acreditamos que o acesso rápido a dados 
                epidemiológicos é fundamental para a prevenção e controle da doença.
              </p>
              <p className="text-muted-foreground">
                Nossa plataforma permite que cidadãos, profissionais de saúde e autoridades públicas tenham 
                acesso a informações sobre a incidência de dengue por estado e cidade, facilitando a tomada de 
                decisões e a implementação de medidas preventivas.
              </p>
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades</CardTitle>
              <CardDescription>
                O que oferecemos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">🗺️ Mapa Interativo</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualize casos de dengue em tempo real em um mapa interativo do Brasil, 
                    com dados atualizados por estado e cidade.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">📊 Estatísticas Detalhadas</h3>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe números de casos confirmados, suspeitos, óbitos e taxas de 
                    incidência por região.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">🔔 Alertas Personalizados</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure alertas para sua localização e receba notificações quando 
                    houver aumento de casos na sua região.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">📱 Acesso Gratuito</h3>
                  <p className="text-sm text-muted-foreground">
                    Plataforma totalmente gratuita e acessível para todos os cidadãos brasileiros, 
                    sem necessidade de cadastro para visualização básica.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Source Card */}
          <Card>
            <CardHeader>
              <CardTitle>Fonte de Dados</CardTitle>
              <CardDescription>
                Transparência e confiabilidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Os dados apresentados nesta plataforma são baseados em informações oficiais e 
                atualizações fornecidas por autoridades de saúde. Nosso objetivo é facilitar o 
                acesso a essas informações de forma clara e visual.
              </p>
              <p className="text-muted-foreground">
                <strong>Importante:</strong> Esta plataforma é uma ferramenta informativa. 
                Para informações oficiais e orientações sobre prevenção e tratamento da dengue, 
                consulte sempre as autoridades de saúde locais e o Ministério da Saúde.
              </p>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
              <CardDescription>
                Entre em contato conosco
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Tem dúvidas, sugestões ou precisa de ajuda? Entre em contato conosco:
              </p>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Email:</strong> info@denguealert.com
                </p>
                <p className="text-sm text-muted-foreground">
                  Estamos sempre abertos a feedback e melhorias para tornar a plataforma 
                  cada vez mais útil para a população brasileira.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center pt-8">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Começar a Usar Agora
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-foreground mb-4">Dengue Alert</h4>
              <p className="text-sm text-muted-foreground">Monitoramento de dengue no Brasil</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/#mapa" className="hover:text-foreground">Mapa</a></li>
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

