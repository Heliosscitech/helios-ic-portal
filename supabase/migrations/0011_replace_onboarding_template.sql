-- =====================================================================
-- Helios İç Portal — Onboarding şablonunu atomik değiştir
-- =====================================================================
-- Client-side "delete + insert" stratejisi yarış koşulları yaratıyordu
-- (FK violation 23503). Tüm replace işlemini tek bir Postgres
-- transaction'ında yürüten RPC fonksiyonu ekliyoruz.
--
-- Kullanım (client'tan):
--   supabase.rpc('replace_onboarding_template', {
--     template: [{title, tasks: [{title, description, assignee}]}, ...]
--   })
-- =====================================================================

create or replace function public.replace_onboarding_template(template jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  phase_record jsonb;
  task_record jsonb;
  new_phase_id uuid;
  phase_pos int := 0;
  task_pos int;
begin
  -- Tüm mevcut şablonları sil (cascade ile task şablonları da gider)
  -- Supabase RLS açıkken DELETE'in WHERE klozu gerekiyor
  delete from public.onboarding_phase_templates where id is not null;

  -- Gelen JSON'u faz/görev olarak yeniden ekle
  for phase_record in select * from jsonb_array_elements(template) loop
    new_phase_id := gen_random_uuid();
    insert into public.onboarding_phase_templates (id, title, position)
    values (
      new_phase_id,
      coalesce(nullif(phase_record->>'title', ''), 'İsimsiz faz'),
      phase_pos
    );

    task_pos := 0;
    for task_record in select * from jsonb_array_elements(phase_record->'tasks') loop
      insert into public.onboarding_task_templates (id, template_id, title, description, assignee, position)
      values (
        gen_random_uuid(),
        new_phase_id,
        coalesce(nullif(task_record->>'title', ''), 'İsimsiz görev'),
        nullif(task_record->>'description', ''),
        nullif(task_record->>'assignee', ''),
        task_pos
      );
      task_pos := task_pos + 1;
    end loop;

    phase_pos := phase_pos + 1;
  end loop;
end;
$$;

grant execute on function public.replace_onboarding_template(jsonb) to authenticated;
