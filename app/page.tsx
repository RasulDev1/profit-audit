import AuditForm from "@/components/AuditForm";

const SOURCES_URL = "https://github.com/RasulDev1/profit-audit/blob/main/docs/sources.md";

export default function Home() {
  return (
    <>
      <div className="backdrop" />
      <nav className="no-print sticky top-0 z-30 border-b border-white/5 bg-[#07070c]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#" className="flex items-center gap-2.5 font-semibold tracking-tight text-white">
            <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
              <defs>
                <linearGradient id="logo" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#6366f1" />
                  <stop offset="1" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#logo)" />
              <rect x="7" y="17" width="4" height="8" rx="1" fill="#fff" fillOpacity=".55" />
              <rect x="14" y="12" width="4" height="13" rx="1" fill="#fff" fillOpacity=".8" />
              <rect x="21" y="7" width="4" height="18" rx="1" fill="#fff" />
            </svg>
            Аудит потерь
          </a>
          <a href={SOURCES_URL} target="_blank" rel="noreferrer" className="rounded-full px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">
            Источники
          </a>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-12 sm:px-6 sm:pt-20 lg:pb-20">
        <header className="no-print mb-12 text-center sm:mb-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-300">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
            </span>
            Бесплатно · без регистрации · 1 минута
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Где ваш бизнес <span className="text-gradient">теряет прибыль</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-400 sm:text-lg">
            Укажите нишу, способ учёта и четыре цифры. Сервис посчитает скрытые потери и подготовит аудит с планом действий.
          </p>
          <p className="mx-auto mt-6 inline-flex max-w-2xl items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-slate-300 backdrop-blur">
            <span className="text-lg leading-none">📚</span>
            <span>
              <strong className="font-semibold text-white">Расчёт основан на открытых исследованиях</strong> Cochrane, Baymard Institute, UIS и других.
              У каждой цифры указан{" "}
              <a href={SOURCES_URL} target="_blank" rel="noreferrer" className="text-indigo-300 underline decoration-indigo-300/40 underline-offset-2 hover:text-indigo-200">
                источник
              </a>
              .
            </span>
          </p>
          <dl className="mx-auto mt-10 grid max-w-xl grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02]">
            {[
              ["9", "ниш"],
              ["6", "способов учёта"],
              ["7", "исследований"],
            ].map(([value, label]) => (
              <div key={label} className="px-3 py-4">
                <dt className="sr-only">{label}</dt>
                <dd className="font-mono text-2xl font-semibold text-white">{value}</dd>
                <dd className="mt-0.5 text-xs text-slate-500">{label}</dd>
              </div>
            ))}
          </dl>
        </header>
        <AuditForm />
      </main>
    </>
  );
}
