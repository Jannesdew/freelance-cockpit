create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subtasks_task_id on public.subtasks (task_id);

create trigger set_subtasks_updated_at
  before update on public.subtasks
  for each row execute function public.set_updated_at();

alter table public.subtasks enable row level security;

create policy "subtasks_select_own" on public.subtasks
  for select using (auth.uid() = user_id);
create policy "subtasks_insert_own" on public.subtasks
  for insert with check (auth.uid() = user_id);
create policy "subtasks_update_own" on public.subtasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subtasks_delete_own" on public.subtasks
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.subtasks to authenticated;
