-- ============================================================
-- MIGRACION 011 - Autenticacion por username (sin email publico)
-- ============================================================

-- ============================================================
-- FUNCION: get_email_by_user_id
-- Permite al cliente obtener el email interno de un usuario
-- para autenticarse. Solo devuelve el email si el usuario existe
-- y no esta baneado. Usa security definer para acceder a auth.users.
-- ============================================================
create or replace function public.get_email_by_user_id(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
begin
  -- Verificar que el usuario existe y no esta baneado
  if not exists (
    select 1 from public.users
    where id = p_user_id and is_banned = false
  ) then
    return null;
  end if;

  -- Obtener email desde auth.users
  select email into v_email
  from auth.users
  where id = p_user_id;

  return v_email;
end;
$$;

-- Solo authenticated y anon pueden llamarla (necesaria para el login)
grant execute on function public.get_email_by_user_id(uuid) to authenticated, anon;

-- ============================================================
-- DESHABILITAR confirmacion de email en Supabase
-- IMPORTANTE: Esto debe hacerse en el Dashboard de Supabase:
--   Authentication > Providers > Email
--   Desactivar "Confirm email"
-- No se puede hacer via SQL — es configuracion del servicio.
-- ============================================================
