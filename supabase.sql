-- Run this entire file in Supabase SQL Editor.
-- Then create a Storage bucket named "books" and make it public.

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  description text,
  category text default 'General',
  language text default 'English',
  cover_url text,
  pdf_url text not null,
  pages integer,
  created_at timestamptz default now()
);

alter table public.books enable row level security;

-- Anyone can browse the public library.
create policy "Public can view books"
on public.books for select
to anon, authenticated
using (true);

-- IMPORTANT:
-- For a simple free personal library, upload/delete operations should be
-- performed by your authenticated admin account. The frontend checks the
-- logged-in admin email before showing the dashboard.
-- Storage policies below allow authenticated users to manage files.
-- Tighten these policies further if your library becomes public at scale.

insert into storage.buckets (id, name, public)
values ('books', 'books', true)
on conflict (id) do update set public = true;

create policy "Public can read book files"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'books');

create policy "Authenticated users can upload book files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'books');

create policy "Authenticated users can update book files"
on storage.objects for update
to authenticated
using (bucket_id = 'books');

create policy "Authenticated users can delete book files"
on storage.objects for delete
to authenticated
using (bucket_id = 'books');
