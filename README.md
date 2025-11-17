Site da DEMO
[Dengue Alerta](https://denguealerta.vercel.app/)

# Projeto Integrado – Revisita da 1ª Entrega

## Revisita Justificada

Durante o desenvolvimento do nosso **Projeto Integrado**, realizamos uma revisão completa da **1ª entrega** para garantir consistência e qualidade na **2ª etapa**.

A primeira fase recebeu **nota máxima (10 pontos)**, sem comentários ou sugestões de melhorias por parte dos avaliadores. Mesmo assim, entendemos que sempre há espaço para evoluir.  

Por isso, **todas as melhorias identificadas durante a elaboração da segunda etapa serão implementadas**, buscando uma entrega mais sólida, otimizada e alinhada às melhores práticas.

---
# Dengue Alerta - Sistema de Monitoramento de Dengue

Sistema web para monitoramento e alertas de casos de dengue no Brasil, desenvolvido com Next.js, React, TypeScript e Supabase.

## Índice

- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração do Supabase](#configuração-do-supabase)
- [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
- [Executando o Projeto](#executando-o-projeto)

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn** (gerenciador de pacotes)
- **Git** (para clonar o repositório)
- **Conta no Supabase** (gratuita em [supabase.com](https://supabase.com))

## Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/denguealerta.git
cd denguealerta
```

### 2. Instalar Dependências

```bash
npm install
```

Isso instalará todas as dependências necessárias listadas no `package.json`, incluindo:
- Next.js 16
- React 19
- Supabase (SSR e JS)
- Leaflet (mapas)
- Tailwind CSS
- E outras bibliotecas necessárias

## Configuração do Supabase

### 1. Criar Conta e Projeto no Supabase

### 2. Obter Credenciais do Supabase

Após criar o projeto:

1. No painel do Supabase, vá em **Settings** → **API**
2. Você encontrará:
   - **Project URL**: Copie esta URL (será `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public key**: Copie esta chave (será `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role key**: Clique em "Reveal" e copie (será `SUPABASE_SERVICE_ROLE_KEY`)
   - ⚠️ **IMPORTANTE**: A `service_role` key tem permissões totais - mantenha-a segura!

### 3. Criar Tabelas no Banco de Dados

No painel do Supabase:

1. Vá em **SQL Editor** (ícone de banco de dados no menu lateral)
2. Execute os scripts SQL dos schemas do BD:

### 4. Configurar Autenticação

1. No painel do Supabase, vá em **Authentication** → **Providers**
2. Certifique-se de que **Email** está habilitado
3. (Opcional) Configure outros provedores (Google, GitHub, etc.)

## Configuração de Variáveis de Ambiente

### 1. Criar Arquivo `.env.local`

Na raiz do projeto, crie um arquivo chamado `.env.local`:

```bash
# Windows (PowerShell)
New-Item -Path .env.local -ItemType File

# Linux/Mac
touch .env.local
```

### 2. Adicionar Variáveis

Abra o arquivo `.env.local` e adicione as seguintes variáveis com os valores do seu projeto Supabase:

```env
# URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave pública (anon key)
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui

# Chave de serviço (service role key) - MANTENHA SECRETA!
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

## Executando o Projeto

### Modo de Desenvolvimento

```bash
npm run dev
```

O projeto estará disponível em: [http://localhost:3000](http://localhost:3000)

### Build de Produção

```bash
# Criar build de produção
npm run build

# Executar build de produção
npm start
```

### Linting

```bash
npm run lint
```

## Licença

Este projeto está sob a licença MIT.

## Integrantes do Grupo

- **João Pedro Lobo**
- **Leandro Palumbo**
- **Lucas Fernandes da Silva**
- **Nicolas Pantoja**
- **Wellington Honorio Martins**

- **Windson Soares Baia**

