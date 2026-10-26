import Calculator from "@/components/Calculator";

export default function Home() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 pb-28 pt-8 sm:px-8 lg:py-12">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:mb-10">
        <div>
          <div className="mb-3 text-xs font-medium uppercase tracking-[.12em] text-faint sm:text-sm">Автоматизация Instagram</div>
          <h1 className="text-[clamp(32px,4.2vw,56px)] font-medium leading-[1.08] tracking-[-0.025em] text-ink">
            Калькулятор синергии продаж
          </h1>
        </div>
        <div className="text-sm text-muted sm:text-base">Примерный расчёт на 30 дней</div>
      </div>
      <Calculator />
    </main>
  );
}
