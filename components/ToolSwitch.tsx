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
      className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors sm:p-5 ${
        on ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-line-strong"
      }`}
    >
      <span className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-accent" : "bg-line-strong"}`}>
        <span
          className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
            on ? "translate-x-5" : ""
          }`}
        />
      </span>
      <span className="flex-1">
        <span className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold text-ink sm:text-lg">{tool.title}</span>
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
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
