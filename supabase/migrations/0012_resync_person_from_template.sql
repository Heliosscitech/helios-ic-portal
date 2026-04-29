-- =====================================================================
-- Helios İç Portal — Kişinin görevlerini şablondan yeniden klonla
-- =====================================================================
-- Şablon güncellendikten sonra mevcut bir kişinin faz/görevlerini
-- şablonun yeni halinden klonlamak için atomik RPC.
-- DİKKAT: kişinin "isDone" işaretleri kaybolur.
-- =====================================================================

create or replace function public.resync_person_from_template(p_person_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  phase_record record;
  task_record record;
  new_phase_id uuid;
  phase_pos int := 0;
  task_pos int;
begin
  -- Kişinin mevcut fazlarını sil (cascade ile görevler de gider)
  delete from public.onboarding_phases where person_id = p_person_id;

  -- Şablonu sırasıyla klonla
  for phase_record in
    select id, title, position
    from public.onboarding_phase_templates
    order by position
  loop
    new_phase_id := gen_random_uuid();
    insert into public.onboarding_phases (id, person_id, title, position)
    values (new_phase_id, p_person_id, phase_record.title, phase_pos);

    task_pos := 0;
    for task_record in
      select title, description, assignee, position
      from public.onboarding_task_templates
      where template_id = phase_record.id
      order by position
    loop
      insert into public.onboarding_tasks
        (id, phase_id, title, description, assignee, is_done, position)
      values (
        gen_random_uuid(),
        new_phase_id,
        task_record.title,
        task_record.description,
        task_record.assignee,
        false,
        task_pos
      );
      task_pos := task_pos + 1;
    end loop;

    phase_pos := phase_pos + 1;
  end loop;
end;
$$;

grant execute on function public.resync_person_from_template(uuid) to authenticated;
