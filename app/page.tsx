import AuditForm from "@/components/AuditForm";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-8 lg:pb-16 sm:px-6 sm:pt-12">
      <header className="no-print mb-8 sm:mb-10">
        <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Бесплатно · без регистрации · 1 минута
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Где ваш бизнес теряет прибыль
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600 sm:text-lg">
          Укажите нишу, способ учёта и четыре цифры. Сервис посчитает скрытые потери по данным исследований и подготовит аудит с планом действий.
        </p>
      </header>
      <AuditForm />
    </main>
  );
}
