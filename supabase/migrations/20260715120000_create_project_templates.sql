create table public.project_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  -- Array of { title: text, urgency?: 'low'|'normal'|'high'|'urgent' }.
  -- Deliberately not a normalized child table: templates are simple,
  -- ordered task lists that never need to be queried independently.
  tasks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_project_templates_user_id on public.project_templates (user_id);

create trigger set_project_templates_updated_at
  before update on public.project_templates
  for each row execute function public.set_updated_at();

alter table public.project_templates enable row level security;

create policy "project_templates_select_own" on public.project_templates
  for select using (auth.uid() = user_id);
create policy "project_templates_insert_own" on public.project_templates
  for insert with check (auth.uid() = user_id);
create policy "project_templates_update_own" on public.project_templates
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "project_templates_delete_own" on public.project_templates
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.project_templates to authenticated;
