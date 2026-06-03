-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Profiles: one row per authenticated user
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz default now()
);

-- Pairs: a confirmed bond between two users
create table pairs (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles(id) on delete cascade,
  user_b uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  constraint no_self_pair check (user_a <> user_b)
);

create unique index unique_pair_idx on pairs (
  least(user_a::text, user_b::text),
  greatest(user_a::text, user_b::text)
);


-- Invites: single-use tokens for pairing
create table invites (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  inviter_id uuid not null references profiles(id) on delete cascade,
  accepted_by uuid references profiles(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table pairs enable row level security;
alter table invites enable row level security;

-- Profiles: users can read any profile (needed to show partner name), only write own
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Pairs: only members of a pair can see it
create policy "pairs_select" on pairs for select using (
  auth.uid() = user_a or auth.uid() = user_b
);
create policy "pairs_insert" on pairs for insert with check (
  auth.uid() = user_a or auth.uid() = user_b
);

-- Invites: inviter can read/create their own; anyone can read by token (for accept flow)
create policy "invites_select_own" on invites for select using (
  auth.uid() = inviter_id
);
create policy "invites_select_by_token" on invites for select using (true);
create policy "invites_insert" on invites for insert with check (
  auth.uid() = inviter_id
);
create policy "invites_update_accept" on invites for update using (true);
create policy "invites_delete" on invites for delete using (
  auth.uid() = inviter_id
);

create policy "pairs_delete" on pairs for delete using (
  auth.uid() = user_a or auth.uid() = user_b
);
