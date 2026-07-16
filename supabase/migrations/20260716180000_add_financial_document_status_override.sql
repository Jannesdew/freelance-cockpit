-- Tracks whether `status` was set manually in Cockpit rather than imported from
-- DigiBoox, so a future re-import doesn't clobber a manual status change.
alter table public.financial_documents
  add column status_override boolean not null default false;
