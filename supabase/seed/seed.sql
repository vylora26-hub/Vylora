-- ============================================================
-- SEED DATA - Datos iniciales necesarios para arrancar la app
-- Ejecutar UNA SOLA VEZ despues de todas las migraciones
-- ============================================================

-- CATEGORIAS DE SALAS
insert into public.room_categories (id, name, slug, icon) values
  ('general',   'General',       'general',      'chat-bubble-left-right'),
  ('tech',      'Tecnologia',    'tecnologia',   'cpu-chip'),
  ('gaming',    'Gaming',        'gaming',       'puzzle-piece'),
  ('music',     'Musica',        'musica',       'musical-note'),
  ('sports',    'Deportes',      'deportes',     'trophy'),
  ('art',       'Arte y Diseno', 'arte-diseno',  'paint-brush'),
  ('science',   'Ciencia',       'ciencia',      'beaker'),
  ('travel',    'Viajes',        'viajes',       'map'),
  ('food',      'Gastronomia',   'gastronomia',  'cake'),
  ('language',  'Idiomas',       'idiomas',      'language'),
  ('study',     'Estudio',       'estudio',      'academic-cap'),
  ('news',      'Noticias',      'noticias',     'newspaper')
on conflict (id) do nothing;
