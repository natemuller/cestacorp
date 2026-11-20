# Cestacorp · Evolução de Treinamentos (protótipo navegável)

Protótipo de interface web do sistema de treinamentos e desenvolvimento (RH) da Cestacorp, construído para a
**demonstração ao vivo** do projeto Service Learning PUCRS × Cestacorp (2026/2).

> ⚠️ **Não há backend.** Todas as telas do Figma foram implementadas e consomem uma base de dados **fictícia** em JSON
> (`src/data/`). As ações (registrar conclusão, avaliar, publicar PDI, admitir colaborador…) alteram o estado de verdade
> durante a demo e ficam salvas no `localStorage` do navegador.

## Como rodar

Requisitos: **Node.js 20+** e npm.

```bash
npm install
npm run dev        # abre em http://localhost:5173
```

Outros comandos:

| Comando | O que faz |
| --- | --- |
| `npm run dev` / `npm start` | Servidor de desenvolvimento (hot reload) |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Serve o `dist/` em http://localhost:4173 |
| `npm run test:e2e` | Roda os testes de ponta a ponta (Playwright) |
| `npm run lint` | Lint com oxlint |

Na primeira vez que for rodar os testes: `npx playwright install chromium`.

## Acessos da demonstração

| Perfil | E-mail | Senha | Entra como |
| --- | --- | --- | --- |
| Colaborador | `colaborador@email.com` | `cesta123` | Natan Muller · Analista Fiscal Júnior |
| Gestão | `gestor@email.com` | `cesta123` | Luana Thurow · Sócia-diretora |

O perfil é identificado pelo e-mail,
como previsto no Figma. Cada perfil só enxerga as telas do próprio fluxo (o Gestão não vê as telas de colaborador e vice-versa).

Para trocar de perfil: clique no cartão do usuário (canto inferior esquerdo) → **Sair**.
Para **voltar ao estado inicial** dos dados: mesmo menu → **Resetar demo** (recomendado antes de cada apresentação).

## Telas implementadas (23 telas + login)

Cada tela segue o frame correspondente do Figma (`00 · Login` a `23 · Usuários & Acessos`).

**Colaborador**
`Login` · `Meu Painel` · `Minha Trilha` · `Registrar conclusão` · `Meu PDI` · `Ranking & Pins` · `Organograma` ·
`Autoavaliação` · `Certificados` · `Meu perfil` · `Central de alertas`

**Gestão**
`Dashboard` · `Avaliação de Desempenho` · `Organograma & Cargos` · `Trilhas & Cursos` · `Plano de Cargos e Salários` ·
`Consenso da avaliação` · `Ciclos de avaliação` · `Colaboradores` · `Novo colaborador (onboarding)` · `Auditoria` ·
`PDI do liderado` · `Feedback de integração 25/50/75` · `Usuários & Acessos`

## Roteiro sugerido para a demo (≈ 10 min)

1. **Login como Colaborador** → *Meu Painel*: alerta de atraso, KPIs, horas, pins e certificados a vencer.
2. *Ver pendências* → *Minha Trilha* (filtro “Vencidos”). Em **Comunicação Verbal e Não Verbal**, clique em
   **Registrar conclusão** → anexo, avaliação de qualidade/eficácia → **Enviar para validação**.
   Observe: trilha sobe de **72% → 78%**, pontos **1.240 → 1.270**, certificado “Em validação”, ranking e horas atualizados.
3. *Minhas Avaliações* → tente enviar com critérios em branco (validação) → responda os 2 pendentes → **Enviar autoavaliação**.
4. Passeie por *Meu PDI* (nova ação / registrar acompanhamento), *Ranking & Pins*, *Certificados*, *Organograma* e *Meu perfil*.
5. **Sair → Login como Gestão** → *Dashboard* (gráficos, atrasados → **Notificar**).
6. *Avaliações Anuais*: a linha da Natan agora mostra **Avaliar** → avaliação da gestora → **Enviar para consenso** →
   **Concluir e gerar PDI** → editar uma ação → **Publicar PDI para a colaborador**.
7. *Colaboradores* → **+ Novo colaborador** (use “Preencher exemplo”) → onboarding montado automaticamente.
   Em *Ver perfil* de **Bruna Castro**, abra o **Feedback de integração** e conclua.
8. *Trilhas & Cursos*, *Organograma & Cargos* (clique nos cargos do organograma → **Editar cargo**), *Usuários & Acessos* e *Auditoria*
   (todas as ações acima aparecem registradas).
9. **Voltar como Colaborador** → *Central de alertas*: o aviso “Seu novo PDI foi publicado” chegou.

## Dados fictícios

Tudo está em `src/data/*.json` (colaboradores, cargos, cursos, trilha da Natan, certificados, alertas, auditoria,
critérios de avaliação, organograma, dashboard…). `src/lib/seed.ts` monta o estado inicial e `src/lib/store.tsx`
cuida da persistência (`localStorage`, chaves `cestacorp-demo-*`). A “data de hoje” do protótipo é fixa em **14/10/2026**
(`src/lib/format.ts`), para que os números do Figma (dia 14 de 31, vencimentos etc.) permaneçam coerentes.

## Publicar no GitHub Pages (opcional)

O workflow `.github/workflows/deploy.yml` publica o `dist/` a cada push na `main`.
No repositório: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
O app usa rotas por hash (`/#/painel`) e `base: './'`, então funciona em qualquer subcaminho sem configuração extra.

## Tecnologias

React 19 · Vite · TypeScript · React Router (hash) · CSS puro (tokens do Figma) · lucide-react · Poppins (`@fontsource`) ·
Playwright (testes E2E). Escolhidas por alinharem com a stack do projeto (React + Vite + TypeScript).

```
src/
  components/   Layout (sidebar, topbar, busca), UI (cards, tabelas, modais…), organograma
  data/         Base mockada em JSON
  lib/          store (estado + localStorage), seed, selectors, formatadores
  pages/        Uma página por tela do Figma
e2e/            Testes Playwright (jornada completa, permissões, persistência…)
```

## Limitações conhecidas (por ser protótipo)

- Sem backend: e-mails, convites, download de certificados e abertura de cursos externos são **simulados** (aviso na tela).
- Uploads de arquivo não saem do navegador (apenas nome/tamanho são guardados).
- Layout otimizado para desktop (≥ 1280 px); mobile está fora do escopo.
- Os perfis têm menus separados, como no Figma: Colaborador (Meu Painel, Trilha, PDI, Avaliações, Ranking, Certificados, Organograma) e Gestão (Dashboard, Colaboradores, Trilhas, Avaliações Anuais, Organograma & Cargos, Usuários, Auditoria). O gestor não tem “Meu PDI” nem demais telas de colaborador; ele vê os dados do colaborador pelas telas de gestão.
- A Gincana Solidária (US13) não faz parte do protótipo, conforme o mapa de telas do Figma.
