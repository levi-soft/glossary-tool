# 🔧 Remaining Tasks - Quick Fixes

## 3 Vấn Đề Cần Fix

### 1. Real Authentication với Protected Routes

**Hiện tại:**
- ✅ Auth backend complete ([`apps/backend/src/routes/auth.ts`](apps/backend/src/routes/auth.ts:1))
- ✅ LoginPage created ([`apps/frontend/src/pages/LoginPage.tsx`](apps/frontend/src/pages/LoginPage.tsx:1))
- ⚠️ Routes chưa protected

**Để Fix (30 phút):**

#### A. Create AuthContext
```tsx
// apps/frontend/src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react'

interface AuthContextType {
  user: any | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check localStorage for user
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await axios.post('/api/auth/login', { email, password })
    const { user, token } = response.data.data
    
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

#### B. Wrap App với AuthProvider
```tsx
// apps/frontend/src/App.tsx (line 26)
<ErrorBoundary>
  <AuthProvider>  {/* ADD THIS */}
    <QueryClientProvider client={queryClient}>
      ...
    </QueryClientProvider>
  </AuthProvider>
</ErrorBoundary>
```

#### C. Create ProtectedRoute
```tsx
// apps/frontend/src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}
```

#### D. Protect Routes
```tsx
// apps/frontend/src/App.tsx
<Route path="/login" element={<LoginPage />} />
<Route path="/" element={<Navigate to="/projects" />} />
<Route path="/projects" element={
  <ProtectedRoute><ProjectsPage /></ProtectedRoute>
} />
// Repeat for all routes
```

#### E. Add Logout Button
```tsx
// apps/frontend/src/components/Layout.tsx (header)
import { useAuth } from '@/contexts/AuthContext'

const { user, logout } = useAuth()

{user && (
  <div className="flex items-center space