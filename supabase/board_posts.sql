-- 엔딩 클리어 게시판 / 타임 랭킹
-- Supabase SQL Editor에서 전체를 한 번 실행하세요.
-- 닉네임과 플레이타임은 클라이언트 입력을 신뢰하지 않고 profiles/saves에서 가져옵니다.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 20),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nickname'), ''), '플레이어'))
  on conflict (id) do update
  set nickname = excluded.nickname;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

-- 트리거 설치 전에 가입한 기존 사용자도 회원가입 당시 metadata의 닉네임으로 채웁니다.
insert into public.profiles (id, nickname)
select
  u.id,
  coalesce(nullif(btrim(u.raw_user_meta_data ->> 'nickname'), ''), '플레이어')
from auth.users u
on conflict (id) do nothing;

create table if not exists public.board_posts (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  play_time integer not null check (play_time >= 0),
  comment text not null check (char_length(comment) between 1 and 200),
  ending text check (ending in ('bad', 'normal', 'true')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 기존 테이블을 사용 중인 경우 필요한 열만 추가합니다.
alter table public.board_posts add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.board_posts add column if not exists ending text;
alter table public.board_posts add column if not exists updated_at timestamptz not null default now();

create unique index if not exists board_posts_user_id_unique
on public.board_posts (user_id)
where user_id is not null;

create index if not exists board_posts_play_time_rank
on public.board_posts (play_time asc, created_at asc);

alter table public.board_posts enable row level security;

drop policy if exists "board_posts_select_all" on public.board_posts;
create policy "board_posts_select_all"
on public.board_posts for select
to anon, authenticated
using (true);

-- 클라이언트의 직접 insert/update는 허용하지 않습니다.
drop policy if exists "board_posts_insert_authenticated" on public.board_posts;
drop policy if exists "board_posts_update_own" on public.board_posts;

create or replace function public.submit_board_post(review_text text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  profile_nickname text;
  clear_play_time integer;
  clear_ending text;
begin
  if current_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if review_text is null or char_length(btrim(review_text)) < 1
     or char_length(btrim(review_text)) > 200 then
    raise exception '리뷰는 1자 이상 200자 이하로 입력해주세요.';
  end if;

  select p.nickname
  into profile_nickname
  from public.profiles p
  where p.id = current_user_id;

  if profile_nickname is null or btrim(profile_nickname) = '' then
    raise exception '회원가입 닉네임을 찾을 수 없습니다.';
  end if;

  select s.play_time, s.save_data ->> 'ending'
  into clear_play_time, clear_ending
  from public.saves s
  where s.user_id = current_user_id;

  if clear_ending not in ('bad', 'normal', 'true') then
    raise exception '엔딩을 완료한 뒤 게시판에 등록할 수 있습니다.';
  end if;

  insert into public.board_posts (
    user_id, name, play_time, comment, ending, created_at, updated_at
  ) values (
    current_user_id,
    profile_nickname,
    greatest(coalesce(clear_play_time, 0), 0),
    btrim(review_text),
    clear_ending,
    now(),
    now()
  )
  on conflict (user_id) where user_id is not null
  do update set
    name = excluded.name,
    play_time = excluded.play_time,
    comment = excluded.comment,
    ending = excluded.ending,
    updated_at = now();
end;
$$;

revoke all on function public.submit_board_post(text) from public;
grant execute on function public.submit_board_post(text) to authenticated;
