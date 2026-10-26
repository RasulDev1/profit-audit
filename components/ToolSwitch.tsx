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
      className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-colors active:scale-[.995] sm:p-5 ${
        on ? "border-emerald-500/55 bg-emerald-500/[.07]" : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600"
      }`}
    >
      <span
        className={`relative mt-1 h-8 w-[60px] shrink-0 rounded-full transition-colors ${on ? "bg-emerald-500" : "bg-zinc-700"}`}
      >
        <span
          className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ${
            on ? "translate-x-7" : ""
          }`}
        />
      </span>
      <span className="flex-1">
        <span className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-base font-bold sm:text-lg">{tool.title}</span>
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-xs font-bold ${
              on ? "border-emerald-400/40 text-emerald-400" : "border-zinc-700 text-zinc-400"
            }`}
          >
            {tool.badge}
          </span>
        </span>
        <span className="block text-sm leading-relaxed text-zinc-400">{tool.description}</span>
      </span>
    </button>
  );
}
