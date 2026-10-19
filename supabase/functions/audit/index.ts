// Edge-функция: проверяет данные, считает потери и стримит аудит от Claude.
// Ответ: первая строка — JSON с расчётом, дальше markdown-текст аудита.
import Anthropic from "npm:@anthropic-ai/sdk@0.135.0";
import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { calculateLosses, parseAuditInput } from "../_shared/calc.ts";
import { SYSTEM_PROMPT, buildUserMessage } from "../_shared/prompt.ts";

const MODEL = "claude-haiku-5-5";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Только POST" }, 405);

  const parsed = parseAuditInput(await req.json().catch(() => null));
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  if (!Deno.env.get("ANTHROPIC_API_KEY")) return json({ error: "В Supabase не задан секрет ANTHROPIC_API_KEY" }, 500);

  const input = parsed.data;
  const result = calculateLosses(input);

  // SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY Supabase передаёт в функцию сам.
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data: row, error: insertError } = await supabase
    .from("audits")
    .insert({ input, calculation: result, status: "generating" })
    .select("id")
    .single();
  if (insertError) console.error("audits insert", insertError.message);
  const auditId: string | null = row?.id ?? null;

  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(input, result) }],
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(JSON.stringify({ auditId, result }) + "\n"));
      let text = "";
      const save = (status: "done" | "error", model?: string) =>
        auditId ? supabase.from("audits").update({ report: text, status, model }).eq("id", auditId) : null;
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
        await save("done", final.model);
      } catch (err) {
        console.error("audit generation", err);
        controller.enqueue(encoder.encode("\n\n_Не удалось сгенерировать аудит. Попробуйте ещё раз._"));
        await save("error");
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: { ...cors, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
});
