-- Enable vector extension for embeddings (RAG)
create extension if not exists vector;

-- RAG chunks (adjust vector size if you use a different embedding dimension)
create table if not exists public.rag_chunks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  source text not null,
  page_title text,
  section_title text,
  content text not null,
  chunk_index int not null,
  content_hash text not null,
  embedding vector(1536) not null,
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists rag_chunks_content_hash_idx on public.rag_chunks (content_hash);
create index if not exists rag_chunks_source_idx on public.rag_chunks (source);
create index if not exists rag_chunks_embedding_idx on public.rag_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table public.rag_chunks enable row level security;

-- Chat transcripts
create table if not exists public.chat_sessions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  visitor_id text,
  page_url text,
  page_title text,
  referrer text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null,
  content text not null,
  model text,
  prompt_tokens int,
  completion_tokens int,
  total_tokens int,
  sources jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  constraint chat_messages_role_check check (role in ('user', 'assistant', 'system'))
);

create index if not exists chat_messages_session_id_idx on public.chat_messages (session_id);

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- RAG match function
create or replace function public.match_rag_chunks(
  query_embedding vector(1536),
  match_count int default 6,
  match_threshold float default 0.78
)
returns table (
  id uuid,
  content text,
  source text,
  page_title text,
  section_title text,
  metadata jsonb,
  similarity float
)
language sql stable as $$
  select
    id,
    content,
    source,
    page_title,
    section_title,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  from public.rag_chunks
  where 1 - (embedding <=> query_embedding) >= match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
