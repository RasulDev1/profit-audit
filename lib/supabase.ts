import { createClient } from "@supabase/supabase-js";
import type { AuditInput, LossResult } from "./calc";

// Публичный ключ безопасен в браузере: таблица разрешает анонимным пользователям только вставку.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

/** Сохраняет аудит, если Supabase настроен. Ошибки только логируются. */
export async function saveAudit(input: AuditInput, calculation: LossResult, report: string) {
  if (!supabase) return;
  const { error } = await supabase.from("audits").insert({ input, calculation, report, status: "done", model: "templates" });
  if (error) console.error("Не удалось сохранить аудит", error.message);
}
