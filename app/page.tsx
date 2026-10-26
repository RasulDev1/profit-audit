import Image from "next/image";
import Calculator from "@/components/Calculator";
import logo from "./icon.svg";

export default function Home() {
  return (
    <>
      <div className="bg-accent text-white">
        <header className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <a href="https://sultech.site" className="flex min-w-0 items-center gap-3 text-base font-semibold tracking-tight sm:text-lg">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/30 bg-white/10">
              <Image src={logo} alt="" width={28} height={28} />
            </span>
            <span className="truncate">Автоматизация Бизнеса</span>
          </a>
          <a
            href="https://t.me/Rasul_Develop"
            target="_blank"
            rel="noopener"
            className="whitespace-nowrap rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent-soft sm:px-5 sm:text-base"
          >
            Обсудить<span className="hidden sm:inline"> внедрение</span>
          </a>
        </header>
      </div>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8 lg:py-12">
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
    </>
  );
}
