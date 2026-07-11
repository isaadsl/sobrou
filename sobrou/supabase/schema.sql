 ------------------------------------------------------------
-- EXTENSÕES
-- ------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- PROFILES (perfil público de cada usuário)
-- Vinculado 1:1 a auth.users (tabela interna do Supabase Auth)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  email text,
  telefone text,
  foto_perfil text,
  meta_economia_mensal numeric default 0,
  perfil_comportamental text default 'equilibrado', -- 'economico' | 'equilibrado' | 'gastador'
  perfil_calculado_em timestamptz,
  criado_em timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Usuário vê o próprio perfil" on public.profiles;
create policy "Usuário vê o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Usuário edita o próprio perfil" on public.profiles;
create policy "Usuário edita o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Usuário cria o próprio perfil" on public.profiles;
create policy "Usuário cria o próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Cria o perfil automaticamente quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, email, telefone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'telefone'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- RECEITAS
-- ------------------------------------------------------------
create table if not exists public.receitas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  valor numeric not null,
  data_recebimento date not null,
  tipo text default 'Salário',
  observacoes text,
  recebido boolean default false,
  criado_em timestamptz default now()
);

alter table public.receitas enable row level security;

drop policy if exists "Usuário gerencia as próprias receitas" on public.receitas;
create policy "Usuário gerencia as próprias receitas"
  on public.receitas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_receitas_user_data on public.receitas (user_id, data_recebimento);

-- ------------------------------------------------------------
-- DESPESAS
-- ------------------------------------------------------------
create table if not exists public.despesas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  valor numeric not null,
  categoria text default 'Outros',
  data_vencimento date not null,
  prioridade text default 'media', -- 'alta' | 'media' | 'baixa'
  status text default 'pendente',  -- 'pendente' | 'paga'
  observacoes text,
  criado_em timestamptz default now()
);

alter table public.despesas enable row level security;

drop policy if exists "Usuário gerencia as próprias despesas" on public.despesas;
create policy "Usuário gerencia as próprias despesas"
  on public.despesas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_despesas_user_data on public.despesas (user_id, data_vencimento);

-- ------------------------------------------------------------
-- METAS
-- ------------------------------------------------------------
create table if not exists public.metas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  valor_meta numeric not null,
  valor_guardado numeric default 0,
  data_alvo date,
  criado_em timestamptz default now()
);

alter table public.metas enable row level security;

drop policy if exists "Usuário gerencia as próprias metas" on public.metas;
create policy "Usuário gerencia as próprias metas"
  on public.metas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- PLANEJAMENTO DO PRÓXIMO SALÁRIO
-- ------------------------------------------------------------
create table if not exists public.planejamento_proximo_salario (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  valor_previsto numeric not null,
  data_prevista date not null,
  observacoes text,
  criado_em timestamptz default now()
);

alter table public.planejamento_proximo_salario enable row level security;

drop policy if exists "Usuário gerencia os próprios planejamentos" on public.planejamento_proximo_salario;
create policy "Usuário gerencia os próprios planejamentos"
  on public.planejamento_proximo_salario for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.planejamento_itens (
  id uuid primary key default uuid_generate_v4(),
  planejamento_id uuid not null references public.planejamento_proximo_salario(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  valor numeric not null,
  categoria text default 'Outros',
  prioridade text default 'media'
);

alter table public.planejamento_itens enable row level security;

drop policy if exists "Usuário gerencia os próprios itens de planejamento" on public.planejamento_itens;
create policy "Usuário gerencia os próprios itens de planejamento"
  on public.planejamento_itens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- CONVERSAS COM A IA (histórico do Assistente Financeiro)
-- ------------------------------------------------------------
create table if not exists public.conversas_ia (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pergunta text not null,
  resposta text not null,
  contexto_usado jsonb,
  criado_em timestamptz default now()
);

alter table public.conversas_ia enable row level security;

drop policy if exists "Usuário gerencia as próprias conversas" on public.conversas_ia;
create policy "Usuário gerencia as próprias conversas"
  on public.conversas_ia for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_conversas_user_data on public.conversas_ia (user_id, criado_em desc);

-- ------------------------------------------------------------
-- HISTÓRICO MENSAL (para relatórios e cálculo de perfil)
-- ------------------------------------------------------------
create table if not exists public.historico_mensal (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mes text not null, -- formato 'YYYY-MM'
  total_receitas numeric default 0,
  total_despesas numeric default 0,
  economizado numeric default 0,
  unique (user_id, mes)
);

alter table public.historico_mensal enable row level security;

drop policy if exists "Usuário gerencia o próprio histórico" on public.historico_mensal;
create policy "Usuário gerencia o próprio histórico"
  on public.historico_mensal for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);