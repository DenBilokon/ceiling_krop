create table if not exists leads (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  message text,
  created_at timestamptz default now()
);

alter table leads enable row level security;

create table if not exists site_content (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz default now()
);

alter table site_content enable row level security;

