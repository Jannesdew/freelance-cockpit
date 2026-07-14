create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'backlog'
    check (status in ('backlog', 'todo', 'doing', 'feedback', 'done')),
  urgency text not null default 'normal'
    check (urgency in ('low', 'normal', 'high', 'urgent')),
  deadline date,
  position integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tasks_user_id on public.tasks (user_id);
create index idx_tasks_project_id on public.tasks (project_id);
create index idx_tasks_deadline on public.tasks (deadline);
create index idx_tasks_board_order on public.tasks (user_id, status, position);

create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create function public.handle_task_completion()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'done' and (old is null or old.status is distinct from 'done') then
    new.completed_at = now();
  elsif new.status is distinct from 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger tasks_handle_completion
  before insert or update on public.tasks
  for each row execute function public.handle_task_completion();

alter table public.tasks enable row level security;

create policy "tasks_select_own" on public.tasks
  for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on public.tasks
  for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_delete_own" on public.tasks
  for delete using (auth.uid() = user_id);
