create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  google_refresh_token text,
  google_access_token text,
  google_token_expires_at timestamptz,
  google_calendar_id text,
  working_hours_start time not null default '09:00',
  working_hours_end time not null default '17:00',
  working_days smallint[] not null default '{1,2,3,4,5}',
  timezone text not null default 'Europe/Amsterdam',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

create policy "user_settings_select_own" on public.user_settings
  for select using (auth.uid() = user_id);
create policy "user_settings_insert_own" on public.user_settings
  for insert with check (auth.uid() = user_id);
create policy "user_settings_update_own" on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_settings_delete_own" on public.user_settings
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.user_settings to authenticated;
