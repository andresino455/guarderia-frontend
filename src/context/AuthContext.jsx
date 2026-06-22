import { createContext, useState, useEffect, useCallback } from 'react'
import { loginRequest, getMeRequest } from '../api/authApi'
import { getMiGuarderia } from "../api/guarderiaApi";

export const AuthContext = createContext();

function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [guarderia, setGuarderia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Verificar sesión al cargar ──────────────────────────────────────────
  useEffect(() => {
    async function verificarSesion() {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      // Primero obtener el usuario
      try {
        const { data: me } = await getMeRequest();
        setUsuario(me);
      } catch {
        // Token inválido
        localStorage.clear();
        setLoading(false);
        return;
      }

      // Luego obtener la guardería por separado
      try {
        const { data: g } = await getMiGuarderia();
        setGuarderia(g);
      } catch (err) {
        // Log para debug — no limpiar sesión por esto
        console.warn("No se pudo cargar la guardería:", err?.response?.data);
      }

      setLoading(false);
    }

    verificarSesion();
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const { data } = await loginRequest({ email, password });

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      setUsuario(data.usuario);

      // La respuesta del login ya trae la guardería
      if (data.guarderia) {
        setGuarderia(data.guarderia);
      } else {
        // Fallback: pedirla por separado
        try {
          const { data: g } = await getMiGuarderia();
          setGuarderia(g);
        } catch (err) {
          console.warn(
            "No se pudo cargar la guardería post-login:",
            err?.response?.data,
          );
        }
      }

      return { ok: true };
    } catch (err) {
      const respData = err.response?.data;
      const msg = respData?.detail || "Error al iniciar sesión.";
      setError(msg);
      return {
        ok: false,
        status: err.response?.status,
        data: respData,
      };
    }
  }, []);

  // ── Registro ────────────────────────────────────────────────────────────
  const registrar = useCallback(async (datosRegistro) => {
    setError(null);
    try {
      const { registrarGuarderia } = await import("../api/guarderiaApi");
      const { data } = await registrarGuarderia(datosRegistro);

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      setUsuario(data.usuario);
      setGuarderia(data.guarderia);

      return { ok: true, data };
    } catch (err) {
      const respData = err.response?.data;
      setError(respData?.detail || "Error al registrar la guardería.");
      return { ok: false, data: respData };
    }
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.clear();
    setUsuario(null);
    setGuarderia(null);
  }, []);

  // ── Refrescar guardería ─────────────────────────────────────────────────
  const refrescarGuarderia = useCallback(async () => {
    try {
      const { data } = await getMiGuarderia();
      setGuarderia(data);
    } catch {
      // silencioso
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        guarderia,
        loading,
        error,
        login,
        logout,
        registrar,
        refrescarGuarderia,
        isAuthenticated: !!usuario,
        isAdmin: usuario?.rol_nombre === "Administrador",
        isPersonal: usuario?.rol_nombre === "Personal",
        isTutor: usuario?.rol_nombre === "Tutor",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider