-- Сайт на GitHub Pages сохраняет аудиты напрямую из браузера с публичным ключом.
-- Анонимам разрешена только вставка: читать чужие аудиты они не могут.
create policy "anon can insert audits"
  on public.audits
  for insert
  to anon
  with check (true);

grant insert on public.audits to anon;
