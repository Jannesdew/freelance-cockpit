create table public.financial_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('invoice', 'quote')),
  number text not null,
  status text not null,
  document_date date,
  amount_incl numeric(12, 2) not null default 0,
  amount_excl numeric(12, 2) not null default 0,
  vat_amount numeric(12, 2) not null default 0,
  relation_name text,
  description text,
  project_id uuid references public.projects(id) on delete set null,
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kind, number)
);

create index idx_financial_documents_user_id on public.financial_documents (user_id);
create index idx_financial_documents_project_id on public.financial_documents (project_id);

create trigger set_financial_documents_updated_at
  before update on public.financial_documents
  for each row execute function public.set_updated_at();

alter table public.financial_documents enable row level security;

create policy "financial_documents_select_own" on public.financial_documents
  for select using (auth.uid() = user_id);
create policy "financial_documents_insert_own" on public.financial_documents
  for insert with check (auth.uid() = user_id);
create policy "financial_documents_update_own" on public.financial_documents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "financial_documents_delete_own" on public.financial_documents
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.financial_documents to authenticated;
