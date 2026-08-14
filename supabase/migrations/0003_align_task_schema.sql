-- Realigns a hand-applied database with the schema this repo expects.
--
-- Migrations here are applied by hand via the SQL Editor (see README), so a
-- database can end up missing a later migration or holding a column type the
-- app no longer matches. Both drifts surface identically as an opaque HTTP 400
-- from PostgREST on insert:
--
--   * `rank` as an integer type rejects the compare-insertion midpoint. The
--     duel places a task between two neighbours with (before + after) / 2, and
--     PostgREST casts values as text, so '1.5'::integer raises
--     invalid_text_representation (22P02) -> 400. Plain "add task" keeps
--     working, because it only ever computes lastRank + 1.
--   * a missing `tags` column rejects every insert with 42703 -> 400, since
--     createTask always sends tags.
--
-- Every statement below is safe to run on an already-correct database.

alter table public.tasks
  alter column rank type double precision using rank::double precision;

alter table public.tasks
  add column if not exists tags text[] not null default '{}',
  add column if not exists due_time time;

-- Rows that predate the tags column can hold NULL despite the default.
update public.tasks set tags = '{}' where tags is null;
