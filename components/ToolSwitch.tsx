import type { Tool } from "@/lib/calculator";

type Props = {
  tool: Tool;
  on: boolean;
  onToggle: () => void;
};

export default function ToolSwitch({ tool, on, onToggle }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`group flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-[transform,background-color,border-color] duration-300 active:scale-[.985] sm:p-5 [-webkit-tap-highlight-color:transparent] ${
        on ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-line-strong"
      }`}
    >
      <span className={`relative mt-0.5 h-9 w-16 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-accent" : "bg-line-strong"}`}>
        <span
          className={`absolute left-1 top-1 h-7 w-7 rounded-full bg-white shadow-md transition-[transform,width] duration-300 ease-[cubic-bezier(.3,1.5,.5,1)] group-active:w-9 ${
            on ? "translate-x-7 group-active:translate-x-5" : ""
          }`}
        />
      </span>
      <span className="flex-1">
        <span className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold text-ink sm:text-lg">{tool.title}</span>
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-colors duration-300 ${
              on ? "bg-accent text-white" : "bg-canvas text-muted"
            }`}
          >
            {tool.badge}
          </span>
        </span>
        <span className="block text-sm leading-relaxed text-muted">{tool.description}</span>
      </span>
    </button>
  );
}
