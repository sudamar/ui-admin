# CLAUDE.md - Instruções para IA

Este documento contém instruções e diretrizes para modelos de IA (como Claude, ChatGPT, etc.) ao realizar alterações neste projeto.

## 📋 Visão Geral do Projeto

**Nome:** Wow Fafih
**Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui
**Arquitetura:** Feature-based com App Router do Next.js

## 🏗️ Arquitetura do Projeto

### Estrutura de Pastas

```
├── public/                      # Arquivos estáticos (imagens, fonts, etc.)
├── src/
│   ├── app/                     # App Router do Next.js
│   │   ├── (auth)/             # Grupo de rotas de autenticação (públicas)
│   │   │   ├── login/          # Página de login
│   │   ├── dashboard/          # Área administrativa
│   │   │   └── page.tsx        # Principal página do dashboard
│   │   ├── usuario/            # Área front de usuários
│   │   │   └── page.tsx        # Principal página do Usuário
│   │   ├── api/                # API Routes do Next.js
│   │   │   └── health/         # Exemplo: endpoint de health check
│   │   │   └── usuario/       # Exemplo: endpoint de usuarios
│   │   ├── layout.tsx          # Layout raiz (global e mínimo)
│   │   ├── page.tsx            # Página inicial
│   │   └── globals.css         # Estilos globais (Tailwind v4)
│   │
│   ├── components/
│   │   ├── ui/                 # Componentes puros shadcn/ui
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ... 
│   │   └── shared/             # Componentes compartilhados customizados
│   │       └── Header.tsx
│   │
│   ├── features/               # ⭐ CORAÇÃO DA ARQUITETURA
│   │   ├── auth/               # Feature de Autenticação
│   │   │   ├── components/     # Componentes específicos de auth
│   │   │   │   └── LoginForm.tsx
│   │   │   └── lib/            # Lógica de negócio de auth
│   │   │       └── auth.ts
│   │   └── calendario/          # Feature de calendários
│   │       ├── components       # Componentes de calendário
│   │       │   └──LinhaEventos.tsx 
│   │       └── hooks/          # Hooks específicos de admin
│   │           └── useCalendario.ts
│   │   │
│   │   └── usuario/              # Feature dos Usuarios
│   │       ├── components       # Componentes de calendário
│   │       │   └── TabelaUsuarios.tsx 
│   │       └── hooks/          # Hooks específicos de admin
│   │           └── useUsuarios.ts
│   │
│   ├── hooks/                  # Hooks globais reutilizáveis
│   │   └── useAuth.ts
│   │
│   ├── lib/                    # Funções utilitárias e clientes de API
│   │   └── utils.ts            # Utilitários (cn, etc.)
│   │
│   ├── contexts/               # Contextos React globais
│   │   └── AuthContext.tsx
│   │
│   └── types/                  # Tipos TypeScript globais
│       └── index.ts
```

## 🎯 Princípios de Arquitetura

### 1. Feature-Based Architecture

**SEMPRE** organize código por feature (funcionalidade), não por tipo de arquivo.

**SEMPRE** use a filosofia KISS. Não se atenha a algo que não foi pedido. 
**SEMPRE**** que for criar um services de CRUD, faça um getAllFeture, getByIdFeture, deleteFetature, insertFeature, updateByIdFeature.
**PREFIRA** trabalhar métoodo de negócio em detrimento a Metaprogramação, reflections ou trechos de códigos muito complexos de manter. Sempre referencie seus códigos às funcionalidades de negócio do site.
Ao fazer upload de uma foto/avatar seja de professores ou alunos, **use o componente S3 do SUPABASE**. Caso seja documentos, peça-me uma decisão de onde usar. Por enquanto o S3 está disponível apenas para avatares.
**NUNCAS** use undefined para strings vazias. Quando um campo for string e não retornar valor, preencha o form com "". E quando for número, preencha com 0.
**NUNCA** acesse BD via front, sempre faça via API.

### 2. Quando Criar uma Nova Feature

Crie uma nova pasta em `src/features/` quando:
- A funcionalidade é um domínio de negócio distinto
- Tem múltiplos componentes relacionados
- Requer lógica de negócio específica
- É independente de outras features

**Exemplo:**
```bash
# Criar nova feature de "eventos"
mkdir -p src/features/eventos/{components,hooks,lib}
```

### 3. Hierarquia de Componentes

1. **`src/components/ui/`** - Componentes puros do shadcn/ui (NÃO modificar diretamente)
2. **`src/components/shared/`** - Componentes compartilhados entre features
3. **`src/features/*/components/`** - Componentes específicos da feature

## 🎨 Tailwind CSS v4

### Configuração

Este projeto usa **Tailwind CSS v4**, que tem diferenças importantes da v3:

#### ❌ NÃO USE (sintaxe v3):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### ✅ USE (sintaxe v4):
```css
@import "tailwindcss";
```

### Customização de Cores

**NÃO** modifique [tailwind.config.ts](tailwind.config.ts). As cores são definidas em [globals.css](src/app/globals.css) usando `@theme`:

```css
@theme {
  --color-primary: 222.2 47.4% 11.2%;
  --color-primary-foreground: 210 40% 98%;
}
```

### Classes Utilitárias

Use as classes do Tailwind normalmente:
```tsx
<div className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
```

Use a função `cn()` para combinar classes condicionalmente:
```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-class", condition && "conditional-class")} />
```

## 🧩 shadcn/ui

### Adicionar Novos Componentes

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add form
```

### Componentes Disponíveis

O projeto já possui alguns componentes shadcn/ui instalados, mas instale os que forem necessário ao longo do tempo:
- Formulários: `button`, `input`, `form`, `checkbox`, `select`, `textarea`
- Layout: `card`, `separator`, `table`, `tabs`, `sidebar`
- Feedback: `dialog`, `toast`, `popover`, `tooltip`, `progress`
- Navegação: `breadcrumb`, `dropdown-menu`, `command`
- E muito mais...

### Customizar Componentes shadcn/ui

**NÃO modifique** arquivos em `src/components/ui/` diretamente.

✅ **CORRETO:** Criar wrapper
```tsx
// src/components/shared/CustomButton.tsx
import { Button } from "@/components/ui/button";

export function CustomButton({ children, ...props }) {
  return (
    <Button className="custom-styles" {...props}>
      {children}
    </Button>
  );
}
```

## 📝 Padrões de Código

### Componentes

#### Server Components (padrão)
```tsx
// src/app/admin/page.tsx
export default function AdminPage() {
  return <div>Admin Dashboard</div>;
}
```

#### Client Components
```tsx
"use client";

export function InteractiveComponent() {
  const [state, setState] = useState();
  return <div onClick={() => setState(!state)}>...</div>;
}
```

### Hooks Customizados

```tsx
"use client";

import { useState, useEffect } from "react";

export function useCustomHook() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Lógica do hook

  return { data, loading };
}
```

### Contextos

```tsx
"use client";

import { createContext, useContext, ReactNode } from "react";

interface MyContextType {
  value: string;
}

const MyContext = createContext<MyContextType | undefined>(undefined);

export function MyProvider({ children }: { children: ReactNode }) {
  return (
    <MyContext.Provider value={{ value: "example" }}>
      {children}
    </MyContext.Provider>
  );
}

export function useMyContext() {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error("useMyContext must be used within MyProvider");
  }
  return context;
}
```

### API Routes

```tsx
// src/app/api/exemplo/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ data: "example" });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ received: body });
}
```

## 🔧 TypeScript

### Tipos Globais

Defina tipos globais em `src/types/index.ts`:

```tsx
// src/types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}
```

### Tipos Específicos de Feature

Defina em `src/features/[feature]/types.ts`:

```tsx
// src/features/videos/types.ts
export interface Video {
  id: string;
  title: string;
  url: string;
}
```

### Importação de Tipos

```tsx
import type { User } from "@/types";
import type { Video } from "@/features/videos/types";
```

## 🚀 Rotas e Navegação

### Estrutura de Rotas

- `/` - Página inicial ([src/app/page.tsx](src/app/page.tsx))
- `/login` - Login ([src/app/(auth)/login/page.tsx](src/app/(auth)/login/page.tsx))
- `/admin` - Dashboard admin ([src/app/admin/page.tsx](src/app/admin/page.tsx))
- `/api/health` - Health check ([src/app/api/health/route.ts](src/app/api/health/route.ts))

### Criar Nova Rota

```bash
# Rota simples
mkdir src/app/nova-rota
touch src/app/nova-rota/page.tsx

# Rota dinâmica
mkdir src/app/produtos/[id]
touch src/app/produtos/[id]/page.tsx
```

### Grupos de Rotas

Use `()` para agrupar rotas sem afetar a URL:

```bash
# (auth) não aparece na URL
src/app/(auth)/login -> /login
src/app/(auth)/register -> /register
```

### Navegação

```tsx
import Link from "next/link";
import { useRouter } from "next/navigation";

// Link
<Link href="/admin">Admin</Link>

// Programática
const router = useRouter();
router.push("/admin");
```

## 🎨 Estilização

### Prioridades

1. **Tailwind classes** - Preferência padrão
2. **CSS Modules** - Para estilos complexos específicos
3. **Variáveis CSS** - Definidas em [globals.css](src/app/globals.css)

### Exemplo de Estilização

```tsx
// Usando Tailwind (preferido)
<div className="flex items-center gap-4 p-4 bg-card text-card-foreground rounded-lg border">
  <h2 className="text-2xl font-bold">Título</h2>
</div>

// Usando cn() para condicionais
<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "primary" && "primary-class"
)}>
```

## 📦 Gerenciamento de Estado

### Hierarquia

1. **useState** - Estado local do componente
2. **useContext** - Estado compartilhado entre componentes próximos
3. **Custom Hooks** - Lógica reutilizável com estado
4. **Zustand/Redux** - Estado global complexo (adicionar se necessário)

### Exemplo

```tsx
// Local
const [count, setCount] = useState(0);

// Context
const { user } = useAuthContext();

// Custom Hook
const { videos, loading } = useVideos();
```

## 🔐 Autenticação

### Estrutura Atual

- Feature: [src/features/auth/](src/features/auth/)
- Context: [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)
- Hook global: [src/hooks/useAuth.ts](src/hooks/useAuth.ts)

### Implementar Autenticação

1. **NextAuth.js** (recomendado)
2. **Clerk**
3. **Auth0**
4. **Custom JWT**

## 🧪 Testes (Futuro)

Quando adicionar testes:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Estrutura:
```
src/features/videos/
  ├── components/
  │   ├── VideoPlayer.tsx
  │   └── VideoPlayer.test.tsx
```

## 📚 Convenções de Nomenclatura

### Arquivos

- Componentes: `PascalCase.tsx` (ex: `VideoPlayer.tsx`)
- Utilitários: `camelCase.ts` (ex: `formatDate.ts`)
- Hooks: `use*.ts` (ex: `useVideos.ts`)
- Tipos: `types.ts` ou `*.types.ts`

### Variáveis e Funções

- Componentes: `PascalCase` (ex: `VideoPlayer`)
- Funções: `camelCase` (ex: `handleSubmit`)
- Constantes: `UPPER_SNAKE_CASE` (ex: `MAX_FILE_SIZE`)
- Hooks: `use*` (ex: `useAuth`)

### Tipos e Interfaces

```tsx
// Preferir interface para objetos
interface User {
  id: string;
  name: string;
}

// Type para unions, helpers
type Status = "loading" | "success" | "error";
type Optional<T> = T | null;
```

## 🚨 Checklist para Alterações

Antes de criar/modificar código, verifique:

- [ ] A alteração segue a arquitetura feature-based?
- [ ] O componente está na pasta correta?
- [ ] Usei `"use client"` apenas quando necessário?
- [ ] Usei a sintaxe correta do Tailwind v4?
- [ ] Tipos TypeScript estão definidos?
- [ ] Imports usam aliases `@/*`?
- [ ] Componentes shadcn/ui foram importados corretamente?
- [ ] Não modifiquei componentes em `src/components/ui/` diretamente?

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm run start

# Adicionar componente shadcn/ui
npx shadcn@latest add [component-name]

# Adicionar múltiplos componentes
npx shadcn@latest add button input card dialog

# Verificar componentes disponíveis
npx shadcn@latest add
```

## 📖 Exemplos de Uso

### Criar Nova Feature "Produtos"

```bash
# 1. Criar estrutura
mkdir -p src/features/produtos/{components,hooks,lib}

# 2. Criar tipos
cat > src/features/produtos/types.ts << 'EOF'
export interface Produto {
  id: string;
  nome: string;
  preco: number;
}
EOF

# 3. Criar componente
cat > src/features/produtos/components/ProdutoCard.tsx << 'EOF'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Produto } from "../types";

interface ProdutoCardProps {
  produto: Produto;
}

export function ProdutoCard({ produto }: ProdutoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{produto.nome}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>R$ {produto.preco.toFixed(2)}</p>
      </CardContent>
    </Card>
  );
}
EOF

# 4. Criar página
mkdir src/app/produtos
cat > src/app/produtos/page.tsx << 'EOF'
import { ProdutoCard } from "@/features/produtos/components/ProdutoCard";

export default function ProdutosPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Produtos</h1>
      {/* Lista de produtos */}
    </div>
  );
}
EOF
```

### Criar API Route

```tsx
// src/app/api/produtos/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // Buscar produtos do banco de dados
  const produtos = [
    { id: "1", nome: "Produto 1", preco: 99.90 },
    { id: "2", nome: "Produto 2", preco: 149.90 },
  ];

  return NextResponse.json(produtos);
}

export async function POST(request: Request) {
  const body = await request.json();

  // Validar e salvar produto

  return NextResponse.json({ success: true, id: "new-id" });
}
```

### Criar Hook Customizado

```tsx
// src/features/produtos/hooks/useProdutos.ts
"use client";

import { useState, useEffect } from "react";
import type { Produto } from "../types";

export function useProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProdutos() {
      try {
        const response = await fetch("/api/produtos");
        if (!response.ok) throw new Error("Erro ao buscar produtos");
        const data = await response.json();
        setProdutos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    fetchProdutos();
  }, []);

  return { produtos, loading, error };
}
```

## 🎯 Boas Práticas Específicas

### 1. Performance

- Use `loading.tsx` e `error.tsx` para estados de carregamento
- Implemente Suspense boundaries
- Use `Image` do Next.js para otimização de imagens
- Lazy load componentes pesados

```tsx
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <p>Carregando...</p>,
});
```

### 2. SEO

```tsx
// src/app/produtos/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Produtos - Wow Fafih",
  description: "Confira nossos produtos",
};
```

### 3. Acessibilidade

- Use tags semânticas HTML
- Adicione `aria-label` quando necessário
- Garanta contraste adequado
- Teste navegação por teclado

```tsx
<button
  aria-label="Fechar modal"
  className="..."
>
  <X className="h-4 w-4" />
</button>
```

## 🔄 Fluxo de Trabalho Recomendado

1. **Entender a tarefa** - Leia completamente este documento
2. **Planejar** - Identifique qual feature/pasta modificar
3. **Verificar existente** - Veja se já existe estrutura similar
4. **Implementar** - Siga os padrões documentados
5. **Testar** - Rode `npm run dev` e teste visualmente
6. **Validar** - Execute checklist acima

## 📞 Referências Rápidas

- **Next.js 15 Docs:** https://nextjs.org/docs
- **React 19 Docs:** https://react.dev
- **Tailwind v4 Docs:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **TypeScript:** https://www.typescriptlang.org/docs

---

## 🤖 Instruções Específicas para IAs

### Ao Criar Código

1. **SEMPRE** pergunte se não tiver certeza da localização correta
2. **SEMPRE** use a arquitetura feature-based
3. **SEMPRE** use TypeScript com tipagem completa
4. **NUNCA** modifique arquivos em `src/components/ui/` diretamente
5. **SEMPRE** use sintaxe Tailwind v4 (`@import "tailwindcss"`)
6. **SEMPRE** use aliases de import (`@/` em vez de `../../`)

### Ao Modificar Código

1. **LEIA** o arquivo completamente antes de modificar
2. **PRESERVE** os padrões existentes
3. **MANTENHA** consistência com código adjacente
4. **COMENTE** mudanças complexas ou não-óbvias

### Ao Adicionar Dependências

1. **VERIFIQUE** se shadcn/ui já oferece a funcionalidade
2. **PREFIRA** bibliotecas leves e mantidas
3. **DOCUMENTE** o motivo da adição
4. **TESTE** compatibilidade com Next.js 15 e React 19

### Respostas Esperadas

Ao receber uma solicitação, responda com:

1. **Confirmação de entendimento**
2. **Plano de implementação** (qual feature/arquivo)
3. **Código** com comentários explicativos
4. **Instruções de teste** (se aplicável)
5. **Próximos passos** (se houver)
5. **Sempre rode NPM LINT** em cada alteração para verificar erros.

---

**Última atualização:** 2025-10-22
**Versão do documento:** 1.0.0
