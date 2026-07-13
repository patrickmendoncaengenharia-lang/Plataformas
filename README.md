# Plataforma de Viabilidade

Estudo de viabilidade econômico-financeira para loteamentos, online. Login,
premissas cadastráveis, motor de cálculo auditado contra a planilha Excel do
Residencial Nair Retuci II (TIR/VPL/lucro/capital necessário/payback batem
com diferença de centavos), e os módulos: Configurações, Lotes, Cronograma,
Sensibilidade, Parcerias/TIR individual, Planejamento Tributário, Dashboard e
Relatório Executivo com parecer automático.

## Colocar no ar (5 minutos)

1. **Criar um projeto no Supabase** — [supabase.com](https://supabase.com), gratuito.
   Você mesmo cria a conta; eu não posso fazer isso por você.
2. No projeto criado, abra **SQL Editor** e rode o conteúdo de `supabase/schema.sql`
   (cria as tabelas `estudos` e `participantes`, com Row Level Security já configurado
   — cada usuário só vê os próprios estudos).
3. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.
4. Cole no `.env.local` (copie de `.env.local.example` se ainda não existir):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
   ```
5. `npm install` (se ainda não rodou) e `npm run dev` — abre em `http://localhost:3000`.

Sem esses 4 primeiros passos, o login não funciona (as chaves hoje no
`.env.local` são placeholders só pra o servidor subir).

## Estrutura

- `src/lib/calc-engine.ts` — motor de cálculo. Único lugar com a lógica financeira;
  cada fórmula tem comentário explicando a origem (planilha) ou a metodologia
  (quando é algo novo, como o Índice de Viabilidade e o Parecer Executivo).
- `src/lib/dates.ts` — conversão entre datas reais e os meses relativos que o motor usa.
- `src/app/estudos/[id]/*` — um diretório por módulo (configuracoes, lotes, cronograma,
  sensibilidade, parcerias, tributacao, relatorio).
- `supabase/schema.sql` — schema completo, pronto pra rodar no SQL Editor do Supabase.
- `scripts/` — scripts de validação (`npx tsx scripts/validar-nair-retuci.ts` etc.),
  usados para auditar o motor contra a planilha real. Rode depois de qualquer mudança
  em `calc-engine.ts`.

## Validação

O motor é validado com os 89 lotes reais do Nair Retuci II — TIR, VPL, lucro,
capital necessário, payback e mês do pico batem com a planilha Excel dentro de
0,001%. Rode `npx tsx scripts/validar-nair-retuci.ts` pra conferir a qualquer momento.

## Comandos

```bash
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção
npx tsc --noEmit # typecheck
```
