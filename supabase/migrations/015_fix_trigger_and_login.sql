select 1; -- inicio

-- ============================================================
-- MIGRACION 015 - Corrección del trigger de registro
-- El trigger anterior usaba el email para generar el username.
-- Ahora usa el username real que el cliente envía en metadata.
-- ============================================================

-- Reemplazar el trigger con la versión corregida
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username     text;
  v_display_name text;
  v_attempt      int := 0;
  v_final_username text;
begin
  -- Leer username y display_name del metadata que envía el cliente al registrarse
  v_username     := lower(trim(coalesce(
    new.raw_user_meta_data->>'username',
    -- Fallback: limpiar la parte del email antes del @
    regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g')
  )));

  v_display_name := coalesce(
    new.raw_user_meta_data->>'display_name',
    v_username
  );

  -- Garantizar que el username sea único (añadir sufijo si ya existe)
  v_final_username := v_username;
  loop
    exit when not exists (
      select 1 from public.users where username = v_final_username
    );
    v_attempt := v_attempt + 1;
    v_final_username := v_username || '_' || v_attempt;
    if v_attempt > 99 then
      -- Último recurso: usar los primeros 8 chars del UUID
      v_final_username := v_username || '_' || substr(new.id::text, 1, 8);
      exit;
    end if;
  end loop;

  -- Insertar en public.users con el username correcto
  insert into public.users (id, username, display_name)
  values (new.id, v_final_username, v_display_name);

  -- Crear configuración por defecto
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Verificar que el trigger sigue activo
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();


-- ============================================================
-- CORREGIR USUARIOS EXISTENTES QUE TIENEN USERNAME INCORRECTO
-- Si ya te registraste y el username quedó como "admin_xxxx"
-- en lugar de "admin", este script lo corrige.
-- ============================================================
do $$
declare
  r record;
begin
  -- Buscar usuarios cuyo username tiene el sufijo UUID (formato _XXXX al final)
  for r in
    select u.id, u.username, au.raw_user_meta_data->>'username' as intended_username
    from public.users u
    join auth.users au on au.id = u.id
    where au.raw_user_meta_data->>'username' is not null
      and u.username != lower(trim(au.raw_user_meta_data->>'username'))
  loop
    begin
      update public.users
      set username = lower(trim(r.intended_username))
      where id = r.id;

      raise notice 'Corregido: % -> %', r.username, lower(trim(r.intended_username));
    exception when unique_violation then
      raise notice 'Skipped (conflict): % already taken for user %', r.intended_username, r.id;
    end;
  end loop;
end;
$$;


-- ============================================================
-- VERIFICACION FINAL
-- ============================================================
select u.id, u.username, u.display_name, au.email, u.created_at
from public.users u
join auth.users au on au.id = u.id
order by u.created_at desc
limit 10;
