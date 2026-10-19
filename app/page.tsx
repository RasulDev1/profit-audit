import AuditForm from "@/components/AuditForm";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Где ваш бизнес теряет прибыль</h1>
        <p className="mt-2 text-slate-600">
          Укажите нишу, способ учёта и несколько цифр. Сервис посчитает скрытые потери и подготовит честный аудит с решением.
        </p>
      </header>
      <AuditForm />
    </main>
  );
}
