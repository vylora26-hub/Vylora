// ============================================================
// FRIEND / SOCIAL TYPES
// ============================================================

import type { PublicUser } from './user'

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected'

export interface Friendship {
  id: string
  requesterId: string
  addresseeId: string
  status: FriendshipStatus
  createdAt: string
  updatedAt: string
  // Hydrated: el otro usuario según perspectiva del viewer
  otherUser?: PublicUser
}

export interface Block {
  blockerId: string
  blockedId: string
  createdAt: string
  // Hydrated
  blockedUser?: PublicUser
}

export interface FriendRequest {
  fromUserId: string
  toUserId: string
}
