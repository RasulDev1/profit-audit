import Anthropic from "@anthropic-ai/sdk";
import { auditInputSchema, calculateLosses } from "@/lib/calc";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/prompt";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = "claude-opus-5-5";

export async function POST(req: Request) {
  const parsed = auditInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Проверьте заполнение формы", issues: parsed.error.issues }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "На сервере не задан ANTHROPIC_API_KEY" }, { status: 500 });
  }

  const input = parsed.data;
  const result = calculateLosses(input);
  const supabase = getSupabase();

  let auditId: string | null = null;
  if (supabase) {
    const { data, error } = await supabase
      .from("audits")
      .insert({ input, calculation: result, status: "generating" })
      .select("id")
      .single();
    if (error) console.error("supabase insert", error);
    auditId = data?.id ?? null;
  }

  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    // При отказе классификатора запрос повторяется на рекомендованной модели.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(input, result) }],
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Первая строка — JSON с расчётом, дальше поток markdown-текста аудита.
      controller.enqueue(encoder.encode(JSON.stringify({ auditId, result }) + "\n"));
      let text = "";
      try {
        stream.on("text", (delta) => {
          text += delta;
          controller.enqueue(encoder.encode(delta));
        });
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          const note = "\n\n_Модель отклонила запрос. Попробуйте изменить комментарий и повторить._";
          text += note;
          controller.enqueue(encoder.encode(note));
        }
        if (supabase && auditId) {
          await supabase.from("audits").update({ report: text, status: "done", model: final.model }).eq("id", auditId);
        }
      } catch (err) {
        console.error("audit generation", err);
        controller.enqueue(encoder.encode("\n\n_Не удалось сгенерировать аудит. Попробуйте ещё раз._"));
        if (supabase && auditId) {
          await supabase.from("audits").update({ report: text, status: "error" }).eq("id", auditId);
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
