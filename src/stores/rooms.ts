// ============================================================
// ROOMS STORE — Listado, búsqueda, join/leave, CRUD de salas
// ============================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isMockMode } from '@/services/supabase'
import { SUPABASE_CONFIG } from '@/config'
import { useAuthStore } from './auth'
import type { Room, RoomCategory, RoomFilters, CreateRoomPayload } from '@/types'

// ---- Mock data ----
const MOCK_CATEGORIES: RoomCategory[] = [
  { id: 'general', name: 'General', slug: 'general', icon: 'chat' },
  { id: 'tech', name: 'Tecnología', slug: 'tecnologia', icon: 'cpu' },
  { id: 'gaming', name: 'Gaming', slug: 'gaming', icon: 'puzzle' },
  { id: 'music', name: 'Música', slug: 'musica', icon: 'musical-note' },
  { id: 'sports', name: 'Deportes', slug: 'deportes', icon: 'trophy' },
  { id: 'art', name: 'Arte & Diseño', slug: 'arte-diseno', icon: 'paint-brush' },
]

const MOCK_ROOMS: Room[] = [
  { id: 'r1', name: 'General', slug: 'general', description: 'Sala de chat general para todos.', coverUrl: null, categoryId: 'general', category: MOCK_CATEGORIES[0], ownerId: 'mock_admin', type: 'public', isFeatured: true, isVerified: true, isArchived: false, maxMembers: 500, memberCount: 42, createdAt: new Date().toISOString(), isMember: false },
  { id: 'r2', name: 'Tecnología', slug: 'tecnologia', description: 'Debates y noticias sobre tech, programación y gadgets.', coverUrl: null, categoryId: 'tech', category: MOCK_CATEGORIES[1], ownerId: 'mock_admin', type: 'public', isFeatured: true, isVerified: false, isArchived: false, maxMembers: 500, memberCount: 28, createdAt: new Date().toISOString(), isMember: false },
  { id: 'r3', name: 'Gaming', slug: 'gaming', description: 'Todo sobre videojuegos, torneos y entretenimiento.', coverUrl: null, categoryId: 'gaming', category: MOCK_CATEGORIES[2], ownerId: 'mock_admin', type: 'public', isFeatured: false, isVerified: false, isArchived: false, maxMembers: 500, memberCount: 15, createdAt: new Date().toISOString(), isMember: false },
  { id: 'r4', name: 'Música en Vivo', slug: 'musica-en-vivo', description: 'Comparte lo que estás escuchando ahora mismo.', coverUrl: null, categoryId: 'music', category: MOCK_CATEGORIES[3], ownerId: 'mock_admin', type: 'public', isFeatured: false, isVerified: false, isArchived: false, maxMembers: 200, memberCount: 9, createdAt: new Date().toISOString(), isMember: false },
  { id: 'r5', name: 'VIP Lounge', slug: 'vip-lounge', description: 'Sala exclusiva con contraseña.', coverUrl: null, categoryId: 'general', category: MOCK_CATEGORIES[0], ownerId: 'mock_admin', type: 'password_protected', isFeatured: false, isVerified: false, isArchived: false, maxMembers: 50, memberCount: 3, createdAt: new Date().toISOString(), isMember: false },
]

export const useRoomsStore = defineStore('rooms', () => {
  const rooms = ref<Room[]>([])
  const categories = ref<RoomCategory[]>([])
  const currentRoom = ref<Room | null>(null)
  const loading = ref(false)
  const loadingRoom = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(false)

  const featured = computed(() => rooms.value.filter(r => r.isFeatured))
  const myRooms = computed(() => rooms.value.filter(r => r.isMember))

  // ---- Actions ----

  async function fetchCategories(): Promise<void> {
    if (categories.value.length) return
    if (isMockMode) { categories.value = MOCK_CATEGORIES; return }
    const { data } = await supabase!.from(SUPABASE_CONFIG.TABLES.ROOM_CATEGORIES).select('*').order('name')
    if (data) categories.value = data.map(_mapCategory)
  }

  async function fetchRooms(filters: RoomFilters = {}): Promise<void> {
    loading.value = true
    error.value = null
    try {
      if (isMockMode) {
        let result = [...MOCK_ROOMS]
        if (filters.search) result = result.filter(r => r.name.toLowerCase().includes(filters.search!.toLowerCase()))
        if (filters.categoryId) result = result.filter(r => r.categoryId === filters.categoryId)
        if (filters.featured) result = result.filter(r => r.isFeatured)
        rooms.value = result
        hasMore.value = false
        return
      }
      const { data } = await supabase!.rpc('get_rooms', {
        p_category_id: filters.categoryId ?? null,
        p_search: filters.search ?? null,
        p_featured: filters.featured ?? null,
        p_limit: 20,
        p_offset: 0,
      })
      if (data) {
        const authStore = useAuthStore()
        rooms.value = await _hydrateRooms(data, authStore.userId)
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchRoom(slug: string): Promise<Room | null> {
    loadingRoom.value = true
    try {
      if (isMockMode) {
        const r = MOCK_ROOMS.find(r => r.slug === slug) ?? null
        currentRoom.value = r
        return r
      }
      const { data } = await supabase!
        .from(SUPABASE_CONFIG.TABLES.ROOMS)
        .select('*, category:room_categories(*), owner:users!rooms_owner_id_fkey(id,username,display_name,avatar_url,role,is_verified,last_seen_at)')
        .eq('slug', slug)
        .eq('is_archived', false)
        .single()
      if (!data) return null
      const room = _mapRoom(data)
      currentRoom.value = room
      return room
    } finally {
      loadingRoom.value = false
    }
  }

  async function joinRoom(roomId: string, password?: string): Promise<boolean> {
    const authStore = useAuthStore()
    if (!authStore.userId) return false
    if (isMockMode) {
      const room = rooms.value.find(r => r.id === roomId)
      if (room) { room.isMember = true; room.memberCount++ }
      if (currentRoom.value?.id === roomId) { currentRoom.value.isMember = true; currentRoom.value.memberCount++ }
      return true
    }
    // Verificar contraseña si aplica
    if (password) {
      const { data: valid } = await supabase!.rpc('verify_room_password', { p_room_id: roomId, p_password: password })
      if (!valid) { error.value = 'Contraseña incorrecta.'; return false }
    }
    const { error: err } = await supabase!.from(SUPABASE_CONFIG.TABLES.ROOM_MEMBERS).insert({ room_id: roomId, user_id: authStore.userId })
    if (err) { error.value = 'No se pudo unir a la sala.'; return false }
    const room = rooms.value.find(r => r.id === roomId)
    if (room) { room.isMember = true; room.memberCount++ }
    if (currentRoom.value?.id === roomId) { currentRoom.value.isMember = true }
    return true
  }

  async function leaveRoom(roomId: string): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.userId) return
    if (!isMockMode) {
      await supabase!.from(SUPABASE_CONFIG.TABLES.ROOM_MEMBERS)
        .delete().eq('room_id', roomId).eq('user_id', authStore.userId)
    }
    const room = rooms.value.find(r => r.id === roomId)
    if (room) { room.isMember = false; if (room.memberCount > 0) room.memberCount-- }
    if (currentRoom.value?.id === roomId) currentRoom.value.isMember = false
  }

  async function createRoom(payload: CreateRoomPayload): Promise<Room | null> {
    const authStore = useAuthStore()
    if (!authStore.userId) return null
    if (isMockMode) {
      const newRoom: Room = {
        id: `r_${Date.now()}`, name: payload.name,
        slug: payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: payload.description ?? null, coverUrl: null,
        categoryId: payload.categoryId ?? null, category: null,
        ownerId: authStore.userId, type: payload.type,
        isFeatured: false, isVerified: false, isArchived: false,
        maxMembers: payload.maxMembers ?? 500, memberCount: 1,
        createdAt: new Date().toISOString(), isMember: true, memberRole: 'owner',
      }
      rooms.value.unshift(newRoom)
      return newRoom
    }
    const { data, error: err } = await supabase!.from(SUPABASE_CONFIG.TABLES.ROOMS).insert({
      name: payload.name,
      slug: payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36),
      description: payload.description,
      category_id: payload.categoryId,
      owner_id: authStore.userId,
      type: payload.type,
      max_members: payload.maxMembers ?? 500,
    }).select().single()
    if (err || !data) { error.value = 'Error al crear la sala.'; return null }
    return _mapRoom(data)
  }

  // ---- Mappers ----
  function _mapCategory(row: Record<string, unknown>): RoomCategory {
    return { id: row.id as string, name: row.name as string, slug: row.slug as string, icon: (row.icon as string) ?? 'chat' }
  }

  function _mapRoom(row: Record<string, unknown>): Room {
    return {
      id: row.id as string, name: row.name as string, slug: row.slug as string,
      description: (row.description as string | null) ?? null,
      coverUrl: (row.cover_url as string | null) ?? null,
      categoryId: (row.category_id as string | null) ?? null,
      category: row.category ? _mapCategory(row.category as Record<string, unknown>) : null,
      ownerId: row.owner_id as string, type: row.type as Room['type'],
      isFeatured: (row.is_featured as boolean) ?? false,
      isVerified: (row.is_verified as boolean) ?? false,
      isArchived: (row.is_archived as boolean) ?? false,
      maxMembers: (row.max_members as number) ?? 500,
      memberCount: (row.member_count as number) ?? 0,
      createdAt: row.created_at as string,
    }
  }

  async function _hydrateRooms(rows: Record<string, unknown>[], userId: string | null): Promise<Room[]> {
    if (!userId) return rows.map(_mapRoom)
    const { data: memberships } = await supabase!
      .from(SUPABASE_CONFIG.TABLES.ROOM_MEMBERS).select('room_id,role').eq('user_id', userId)
    const memberMap = new Map((memberships ?? []).map((m: Record<string, unknown>) => [m.room_id, m.role]))
    return rows.map(r => ({ ..._mapRoom(r), isMember: memberMap.has(r.id as string), memberRole: memberMap.get(r.id as string) as Room['memberRole'] }))
  }

  return {
    rooms, categories, currentRoom, loading, loadingRoom, error, hasMore,
    featured, myRooms,
    fetchCategories, fetchRooms, fetchRoom, joinRoom, leaveRoom, createRoom,
  }
})
