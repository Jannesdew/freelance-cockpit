-- Local development seed data only. Never applied to the cloud project via `db push`.
-- Creates one demo auth user (email/password) plus a couple of projects and tasks.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'demo@wildewebdesign.nl',
  extensions.crypt('demodemo', extensions.gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"demo@wildewebdesign.nl"}',
  'email',
  now(),
  now(),
  now()
);

insert into public.projects (id, user_id, name, client_name, status, description, start_date, end_date) values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Website relaunch Bakkerij Jansen', 'Bakkerij Jansen', 'actief', 'Volledige restyling van de webshop.', '2026-06-01', '2026-08-15'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Huisstijl De Groene Hoek', 'De Groene Hoek', 'concept', null, null, null),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Onderhoud Van Dam Advocaten', 'Van Dam Advocaten', 'on_hold', 'Jaarlijks onderhoudscontract.', '2026-01-01', null);

insert into public.tasks (user_id, project_id, title, description, status, urgency, deadline, position) values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Wireframes homepage', null, 'done', 'normal', '2026-06-10', 0),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Productpagina template bouwen', null, 'doing', 'high', '2026-07-18', 0),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Checkout koppelen aan Mollie', null, 'todo', 'urgent', '2026-07-16', 0),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Content klant laten aanleveren', null, 'feedback', 'normal', null, 0),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Moodboard opstellen', null, 'backlog', 'low', null, 0),
  ('11111111-1111-1111-1111-111111111111', null, 'Facturen juli versturen', null, 'todo', 'high', '2026-07-20', 0),
  ('11111111-1111-1111-1111-111111111111', null, 'Website eigen portfolio bijwerken', null, 'backlog', 'normal', null, 1);
