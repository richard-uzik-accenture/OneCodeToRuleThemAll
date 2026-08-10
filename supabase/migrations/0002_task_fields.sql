alter table public.tasks
  add column tags text[] not null default '{}',
  add column due_time time;
