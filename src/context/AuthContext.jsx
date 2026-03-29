import { createContext, useState, useEffect, useCallback } from 'react'
import { loginRequest, getMeRequest } from '../api/authApi'

// Exportación separada del contexto (fix del primer warning)
export const AuthContext = createContext()

function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')

    // Fix del segundo warning: no llamar setState directamente,
    // usar una función async interna
    async function verificarSesion() {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const { data } = await getMeRequest()
        setUsuario(data)
      } catch {
        localStorage.clear()
      } finally {
        setLoading(false)
      }
    }

    verificarSesion()
  }, [])

  const login = useCallback(async (email, password) => {
    setError(null)
    try {
      const { data } = await loginRequest({ email, password })
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      setUsuario(data.usuario)
      return true
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al iniciar sesión.'
      setError(msg)
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.clear()
    setUsuario(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      usuario,
      loading,
      error,
      login,
      logout,
      isAuthenticated: !!usuario,
      isAdmin:    usuario?.rol_nombre === 'Administrador',
      isPersonal: usuario?.rol_nombre === 'Personal',
      isTutor:    usuario?.rol_nombre === 'Tutor',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Exportación default del componente (fix del primer warning)
export default AuthProvider