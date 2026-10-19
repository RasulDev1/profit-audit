# Аудит скрытых потерь прибыли

Сервис для предпринимателя: он заполняет короткую форму (ниша, способ учёта клиентов, заявки, средний чек, маржа), а сервис считает, сколько прибыли теряется из-за ручного учёта, и генерирует честный аудит с решением.

Стек: Next.js (статичная сборка), TypeScript, Tailwind CSS, Supabase Edge Functions, Claude API.

## Как это работает

- **Сайт** живёт на GitHub Pages. Это статичные страницы без сервера.
- **Расчёт потерь** выполняется прямо в браузере (`supabase/functions/_shared/calc.ts`). Он показывает три точки потерь по коэффициентам ниши и способа учёта из `supabase/functions/_shared/model.ts`.
- **Текст аудита** пишет Claude внутри функции Supabase `audit` (`supabase/functions/audit/index.ts`). Ключ Claude хранится только в секретах Supabase и в браузер не попадает.
- **Таблица `audits`** в Supabase хранит входные данные, расчёт и текст каждого аудита.

Код в `supabase/functions/_shared/` общий для сайта и функции, поэтому расчёт везде одинаковый.

## Первый запуск (один раз)

### 1. Supabase

1. Создайте проект на [supabase.com](https://supabase.com).
2. Откройте **SQL Editor**, вставьте содержимое `supabase/migrations/0001_audits.sql` и нажмите **Run**.
3. Запомните **Project ref**: это часть адреса проекта `https://<project-ref>.supabase.co`, она же есть в **Project Settings → General**.
4. Создайте токен доступа: аватар → **Account preferences → Access Tokens → Generate new token**.

### 2. Секреты в GitHub

В репозитории откройте **Settings → Secrets and variables → Actions → New repository secret** и добавьте:

| Секрет | Значение |
|---|---|
| `ANTHROPIC_API_KEY` | Ключ Claude API из [console.anthropic.com](https://console.anthropic.com) |
| `SUPABASE_PROJECT_REF` | Project ref из шага 1.3 |
| `SUPABASE_ACCESS_TOKEN` | Токен из шага 1.4 |

### 3. GitHub Pages

**Settings → Pages → Build and deployment → Source: GitHub Actions.**

### 4. Деплой

Откройте **Actions → Deploy → Run workflow**. Дальше сайт и функция обновляются сами после каждого пуша в `main`.

Сайт откроется по адресу `https://<ваш-логин>.github.io/profit-audit/`.

## Локальная разработка

```bash
npm install
cp .env.example .env.local   # впишите адрес функции
npm run dev
```

## Коэффициенты

Все коэффициенты в `supabase/functions/_shared/model.ts` являются отраслевыми допущениями, а не измерениями. Они намеренно консервативны: аудит должен показывать реальный масштаб, а не пугать.

## Ограничения

- Функция `audit` открыта без входа, потому что её вызывает публичная страница. Любой, кто знает адрес, может тратить ваш баланс Claude. Поставьте лимит расходов в console.anthropic.com.
- На бесплатном тарифе Supabase функция работает не дольше 150 секунд, поэтому аудит генерируется с `effort: "low"`.
