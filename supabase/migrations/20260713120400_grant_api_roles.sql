-- Supabase no longer auto-exposes new public-schema tables to the Data API roles.
-- RLS policies restrict which rows are visible/writable; these grants just allow
-- the roles to attempt the query at all (the standard Supabase access model).

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select on public.project_progress to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
