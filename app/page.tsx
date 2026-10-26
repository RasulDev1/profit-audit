import Calculator from "@/components/Calculator";

export default function Home() {
  return (
    <main className="relative mx-auto max-w-[1400px] px-4 py-8 sm:px-8 lg:py-12">
      <div className="backdrop" />
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:mb-10">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[.25em] text-emerald-400 sm:text-sm">Автоматизация Instagram</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">Калькулятор синергии продаж</h1>
        </div>
        <div className="text-sm text-zinc-500 sm:text-base">Примерный расчёт на 30 дней</div>
      </header>
      <Calculator />
    </main>
  );
}
