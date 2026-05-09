import { create } from 'zustand'

interface AppNotification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

interface NotificationsState {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean
  _subscribedUserId: string | null
  _unsub: (() => void) | null

  fetch: (userId?: string) => Promise<void>
  markRead: (id: string) => void
  markAllRead: () => void
  addNotification: (n: AppNotification) => void
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  _subscribedUserId: null,
  _unsub: null,

  fetch: async (userId?: string) => {
    if (!userId) return

    // Don't re-subscribe if already listening for this user
    if (get()._subscribedUserId === userId) return

    // Unsubscribe previous listener
    get()._unsub?.()

    set({ isLoading: true, _subscribedUserId: userId })

    try {
      const { db } = await import('@/lib/firebase')
      const { collection, query, where, onSnapshot } = await import('firebase/firestore')

      const q = query(collection(db, 'notifications'), where('userId', '==', userId))

      const unsub = onSnapshot(q, snap => {
        const list: AppNotification[] = snap.docs
          .map(d => {
            const data = d.data()
            const ts = data.createdAt?.toDate?.()
            return {
              id:        d.id,
              title:     data.title ?? '',
              message:   data.message ?? '',
              type:      data.type ?? 'INFO',
              isRead:    data.read ?? false,
              createdAt: ts ? ts.toISOString() : new Date().toISOString(),
            }
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 30)
        set({
          notifications: list,
          unreadCount:   list.filter(n => !n.isRead).length,
          isLoading:     false,
        })
      }, () => {
        set({ isLoading: false })
      })

      set({ _unsub: unsub })
    } catch (e) {
      console.error('[notifications] failed to subscribe:', e)
      set({ isLoading: false })
    }
  },

  markRead: (id: string) => {
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
      unreadCount:   Math.max(0, state.unreadCount - 1),
    }))
    // Update Firestore asynchronously
    import('@/lib/firebase').then(({ db }) =>
      import('firebase/firestore').then(({ doc, updateDoc }) =>
        updateDoc(doc(db, 'notifications', id), { read: true }).catch(() => {})
      )
    )
  },

  markAllRead: () => {
    const unread = get().notifications.filter(n => !n.isRead)
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    }))
    // Batch update Firestore
    if (unread.length === 0) return
    Promise.all([
      import('@/lib/firebase'),
      import('firebase/firestore'),
    ]).then(([{ db }, { doc, updateDoc }]) =>
      Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }).catch(() => {})))
    )
  },

  addNotification: (n: AppNotification) => {
    set(state => ({
      notifications: [n, ...state.notifications],
      unreadCount:   n.isRead ? state.unreadCount : state.unreadCount + 1,
    }))
  },
}))
