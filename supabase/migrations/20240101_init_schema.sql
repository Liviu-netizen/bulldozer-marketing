
-- Create bookings table
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  email text not null,
  company_url text,
  preferred_date timestamp with time zone,
  notes text,
  status text default 'new'
);

-- Create scorecards table
create table public.scorecards (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  email text not null,
  company_url text,
  arr_range text,
  saas_motion text,
  bottleneck text,
  status text default 'new'
);

-- Enable Row Level Security (RLS)
alter table public.bookings enable row level security;
alter table public.scorecards enable row level security;

-- Create policies to allow public inserts (anyone can submit a form)
create policy "Allow public inserts for bookings"
  on public.bookings for insert
  with check (true);

create policy "Allow public inserts for scorecards"
  on public.scorecards for insert
  with check (true);

-- Create policies to allow read access only to authenticated users (admins) or service roles
-- For now, we'll keep read access restricted. You can view data in Supabase dashboard.
