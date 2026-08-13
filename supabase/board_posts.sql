-- 마을 게시판(클리어 인증) 테이블
-- Supabase 대시보드의 SQL Editor에서 한 번만 실행하면 됩니다.

create table public.board_posts (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) <= 20),
  play_time integer,
  comment text not null check (char_length(comment) <= 200),
  created_at timestamptz not null default now()
);

alter table public.board_posts enable row level security;

-- 누구나 게시글을 읽을 수 있음
create policy "board_posts_select_all"
on public.board_posts for select
to anon, authenticated
using (true);

-- 로그인한 사용자만 글을 남길 수 있음 (게임이 로그인 후에만 진행되므로)
create policy "board_posts_insert_authenticated"
on public.board_posts for insert
to authenticated
with check (true);
