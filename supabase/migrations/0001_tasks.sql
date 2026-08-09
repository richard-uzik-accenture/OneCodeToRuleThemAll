create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  note text,
  status text not null default 'active' check (status in ('active', 'done', 'dropped')),
  rank double precision not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  last_triaged_on date not null default current_date
);

create index tasks_user_status_rank_idx on public.tasks (user_id, status, rank);

alter table public.tasks enable row level security;

create policy "Users manage their own tasks"
  on public.tasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
