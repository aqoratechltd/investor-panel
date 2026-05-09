import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UserProfile } from '@investor-panel/shared'

// ─── Hardcoded Super Admin ────────────────────────────────────────────────────
const SUPER_ADMIN = {
  email: 'admin@investorpanel.io',
  password: 'Admin@1234',
  profile: {
    id: 'super_admin',
    email: 'admin@investorpanel.io',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'SUPER_ADMIN' as const,
    tenantId: 'tenant_admin',
    isEmailVerified: true,
    twoFactorEnabled: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
}

// ─── Lazy Firebase imports ────────────────────────────────────────────────────
async function getFirebaseModules() {
  const [
    { auth, db, isFirebaseConfigured },
    {
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
      signOut,
      sendEmailVerification,
      updateProfile,
      signInWithPhoneNumber,
      RecaptchaVerifier,
      onAuthStateChanged,
    },
    { doc, setDoc, getDoc },
  ] = await Promise.all([
    import('@/lib/firebase'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ])

  return {
    auth, db, isFirebaseConfigured,
    signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
    sendEmailVerification, updateProfile, signInWithPhoneNumber,
    RecaptchaVerifier, onAuthStateChanged,
    doc, setDoc, getDoc,
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  emailVerified: boolean
  phoneVerified: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithPhone: (confirmationResult: any, otp: string) => Promise<void>
  register: (params: {
    firstName: string
    lastName: string
    email: string
    password: string
    phone?: string
    role: 'SELLER' | 'INVESTOR'
  }) => Promise<{ needsEmailVerification: boolean }>
  sendPhoneOTP: (phone: string, recaptchaContainerId: string) => Promise<any>
  resendEmailVerification: () => Promise<void>
  logout: () => Promise<void>
  setUser: (user: UserProfile) => void
  setTokens: (access: string, refresh: string) => void
  initialize: () => Promise<void>
}

// ─── Store ───────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      emailVerified: false,
      phoneVerified: false,
      // ── Login (email/password) ─────────────────────────────────────────
      login: async (email, password) => {
        set({ isLoading: true })
        try {
          // Super admin hardcoded bypass — sign in anonymously to Firebase so
          // Firestore rules (request.auth != null) pass for all admin queries.
          if (email === SUPER_ADMIN.email && password === SUPER_ADMIN.password) {
            const fb = await getFirebaseModules()
            if (fb.isFirebaseConfigured()) {
              try {
                const { signInAnonymously } = await import('firebase/auth')
                await signInAnonymously(fb.auth)
              } catch {}
            }
            localStorage.setItem('access_token', 'super_admin_token')
            set({
              user: SUPER_ADMIN.profile,
              accessToken: 'super_admin_token',
              isAuthenticated: true,
              emailVerified: true,
              isLoading: false,
            })
            return
          }

          const fb = await getFirebaseModules()
          if (!fb.isFirebaseConfigured()) {
            throw new Error('Firebase is not configured. Add credentials to .env.local')
          }

          const credential = await fb.signInWithEmailAndPassword(fb.auth, email, password)
          const fbUser = credential.user
          const idToken = await fbUser.getIdToken()

          // Fetch profile from Firestore
          const profileSnap = await fb.getDoc(fb.doc(fb.db, 'users', fbUser.uid))
          let userProfile: UserProfile

          if (profileSnap.exists()) {
            const data = profileSnap.data()
            userProfile = {
              id: fbUser.uid,
              email: fbUser.email!,
              firstName: data.firstName,
              lastName: data.lastName,
              role: data.role,
              tenantId: data.tenantId,
              phone: data.phone,
              isEmailVerified: fbUser.emailVerified,
              twoFactorEnabled: data.twoFactorEnabled || false,
              createdAt: data.createdAt,
            }
          } else {
            // No Firestore profile yet — build from Firebase Auth data
            userProfile = {
              id: fbUser.uid,
              email: fbUser.email!,
              firstName: fbUser.displayName?.split(' ')[0] || 'User',
              lastName: fbUser.displayName?.split(' ').slice(1).join(' ') || '',
              role: 'INVESTOR',
              tenantId: `tenant_${fbUser.uid}`,
              isEmailVerified: fbUser.emailVerified,
              twoFactorEnabled: false,
              createdAt: new Date().toISOString(),
            }
          }

          localStorage.setItem('access_token', idToken)
          set({
            user: userProfile,
            accessToken: idToken,
            isAuthenticated: true,
            emailVerified: fbUser.emailVerified,
            isLoading: false,
          })
        } catch (error: any) {
          set({ isLoading: false })
          const code = error?.code || ''
          if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
            throw new Error('Invalid email or password')
          }
          if (code === 'auth/too-many-requests') {
            throw new Error('Too many attempts. Please try again later.')
          }
          if (code === 'auth/user-disabled') {
            throw new Error('This account has been disabled.')
          }
          throw new Error(error?.message || 'Login failed')
        }
      },

      // ── Register ──────────────────────────────────────────────────────
      register: async ({ firstName, lastName, email, password, phone, role }) => {
        set({ isLoading: true })
        try {
          const fb = await getFirebaseModules()
          if (!fb.isFirebaseConfigured()) {
            throw new Error('Firebase is not configured. Add credentials to .env.local')
          }

          const credential = await fb.createUserWithEmailAndPassword(fb.auth, email, password)
          const fbUser = credential.user

          await fb.updateProfile(fbUser, { displayName: `${firstName} ${lastName}` })

          // Save profile to Firestore
          const tenantId = `tenant_${fbUser.uid}`
          await fb.setDoc(fb.doc(fb.db, 'users', fbUser.uid), {
            firstName,
            lastName,
            email,
            phone: phone || null,
            role,
            tenantId,
            twoFactorEnabled: false,
            isEmailVerified: true,
            createdAt: new Date().toISOString(),
          })

          const idToken = await fbUser.getIdToken()
          const userProfile: UserProfile = {
            id: fbUser.uid,
            email: fbUser.email!,
            firstName,
            lastName,
            role: role as any,
            tenantId,
            phone: phone || undefined,
            isEmailVerified: true,
            twoFactorEnabled: false,
            createdAt: new Date().toISOString(),
          }

          localStorage.setItem('access_token', idToken)
          set({
            user: userProfile,
            accessToken: idToken,
            isAuthenticated: true,
            emailVerified: true,
            isLoading: false,
          })
          return { needsEmailVerification: false }
        } catch (error: any) {
          set({ isLoading: false })
          const code = error?.code || ''
          if (code === 'auth/email-already-in-use') {
            throw new Error('An account with this email already exists.')
          }
          if (code === 'auth/weak-password') {
            throw new Error('Password is too weak. Use at least 8 characters.')
          }
          throw new Error(error?.message || 'Registration failed')
        }
      },

      // ── Send phone OTP ────────────────────────────────────────────────
      sendPhoneOTP: async (phone, recaptchaContainerId) => {
        const fb = await getFirebaseModules()
        if (!fb.isFirebaseConfigured()) throw new Error('Firebase is not configured')

        const recaptcha = new fb.RecaptchaVerifier(fb.auth, recaptchaContainerId, {
          size: 'invisible',
          callback: () => {},
        })

        return fb.signInWithPhoneNumber(fb.auth, phone, recaptcha)
      },

      // ── Login with phone OTP ──────────────────────────────────────────
      loginWithPhone: async (confirmationResult, otp) => {
        set({ isLoading: true })
        try {
          const credential = await confirmationResult.confirm(otp)
          const fbUser = credential.user
          const idToken = await fbUser.getIdToken()
          const fb = await getFirebaseModules()

          const profileSnap = await fb.getDoc(fb.doc(fb.db, 'users', fbUser.uid))
          let userProfile: UserProfile

          if (profileSnap.exists()) {
            const data = profileSnap.data()
            userProfile = {
              id: fbUser.uid,
              email: fbUser.email || fbUser.phoneNumber || '',
              firstName: data.firstName,
              lastName: data.lastName,
              role: data.role,
              tenantId: data.tenantId,
              phone: fbUser.phoneNumber || undefined,
              isEmailVerified: true,
              twoFactorEnabled: false,
              createdAt: data.createdAt,
            }
          } else {
            // New phone user — create minimal Firestore profile
            const tenantId = `tenant_${fbUser.uid}`
            userProfile = {
              id: fbUser.uid,
              email: fbUser.phoneNumber || '',
              firstName: 'User',
              lastName: '',
              role: 'INVESTOR',
              tenantId,
              phone: fbUser.phoneNumber || undefined,
              isEmailVerified: true,
              twoFactorEnabled: false,
              createdAt: new Date().toISOString(),
            }
            await fb.setDoc(fb.doc(fb.db, 'users', fbUser.uid), {
              ...userProfile,
              createdAt: new Date().toISOString(),
            })
          }

          localStorage.setItem('access_token', idToken)
          set({
            user: userProfile,
            accessToken: idToken,
            isAuthenticated: true,
            emailVerified: true,
            phoneVerified: true,
            isLoading: false,
          })
        } catch (error: any) {
          set({ isLoading: false })
          if (error?.code === 'auth/invalid-verification-code') {
            throw new Error('Invalid OTP code. Please try again.')
          }
          if (error?.code === 'auth/code-expired') {
            throw new Error('OTP code expired. Please request a new one.')
          }
          throw new Error(error?.message || 'Phone verification failed')
        }
      },

      // ── Resend email verification ─────────────────────────────────────
      resendEmailVerification: async () => {
        const fb = await getFirebaseModules()
        if (!fb.isFirebaseConfigured()) return
        const currentUser = fb.auth.currentUser
        if (currentUser && !currentUser.emailVerified) {
          await fb.sendEmailVerification(currentUser)
        }
      },

      // ── Logout ────────────────────────────────────────────────────────
      logout: async () => {
        try {
          const fb = await getFirebaseModules()
          if (fb.isFirebaseConfigured()) await fb.signOut(fb.auth)
        } catch {}
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          emailVerified: false,
          phoneVerified: false,
        })
      },

      // ── Restore session on page load ──────────────────────────────────
      initialize: async () => {
        try {
          const fb = await getFirebaseModules()
          if (!fb.isFirebaseConfigured()) return

          // If super admin was persisted from Zustand, sign in anonymously so
          // Firestore rules (request.auth != null) pass without a real Firebase account.
          const currentState = (globalThis as any).__zustand_auth_state
          const persistedUser = (() => {
            try {
              const raw = localStorage.getItem('investor-panel-auth')
              return raw ? JSON.parse(raw)?.state?.user : null
            } catch { return null }
          })()
          if (persistedUser?.id === 'super_admin' && !fb.auth.currentUser) {
            try {
              const { signInAnonymously } = await import('firebase/auth')
              await signInAnonymously(fb.auth)
            } catch {}
            return
          }

          return new Promise<void>((resolve) => {
            const unsub = fb.onAuthStateChanged(fb.auth, async (fbUser) => {
              unsub()
              if (fbUser) {
                try {
                  const idToken = await fbUser.getIdToken()
                  const profileSnap = await fb.getDoc(fb.doc(fb.db, 'users', fbUser.uid))

                  if (profileSnap.exists()) {
                    const data = profileSnap.data()
                    const userProfile: UserProfile = {
                      id: fbUser.uid,
                      email: fbUser.email || '',
                      firstName: data.firstName,
                      lastName: data.lastName,
                      role: data.role,
                      tenantId: data.tenantId,
                      phone: data.phone,
                      isEmailVerified: fbUser.emailVerified,
                      twoFactorEnabled: data.twoFactorEnabled || false,
                      createdAt: data.createdAt,
                    }
                    localStorage.setItem('access_token', idToken)
                    set({
                      user: userProfile,
                      accessToken: idToken,
                      isAuthenticated: true,
                      emailVerified: fbUser.emailVerified,
                    })
                  }
                } catch {
                  // Firestore read failed — stay logged out
                }
              }
              resolve()
            })
          })
        } catch {}
      },

      setUser: (user) => set({ user }),

      setTokens: (accessToken) => {
        localStorage.setItem('access_token', accessToken)
        set({ accessToken, isAuthenticated: true })
      },
    }),
    {
      name: 'investor-panel-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        emailVerified: state.emailVerified,
      }),
    },
  ),
)
