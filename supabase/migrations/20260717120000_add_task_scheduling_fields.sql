alter table public.tasks
  add column estimated_minutes integer,
  add column scheduled_start timestamptz,
  add column scheduled_end timestamptz,
  add column google_event_id text;

create index idx_tasks_scheduled_start on public.tasks (scheduled_start);
