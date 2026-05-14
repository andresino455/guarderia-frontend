import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import styles from "./Login.module.css";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [intentosRest, setIntentosR] = useState(null);

  // ── Countdown cuando está bloqueado ──────────────────────────
  useEffect(() => {
    if (!bloqueado || countdown <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setBloqueado(false);
          setError(null);
          setIntentosR(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [bloqueado, countdown]);

  const formatCountdown = (segundos) => {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error && !bloqueado) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (bloqueado) return;

    setSubmitting(true);
    setError(null);

    try {
      const resultado = await loginDirecto(form.email, form.password);

      if (resultado.ok) {
        navigate("/dashboard");
        return;
      }

      // Manejar errores
      const data = resultado.data;

      if (resultado.status === 429 || data?.bloqueado) {
        setBloqueado(true);
        setCountdown(data?.segundos_restantes ?? 300);
        setError(data?.detail ?? "Cuenta bloqueada temporalmente.");
        setIntentosR(0);
      } else {
        setError(data?.detail ?? "Credenciales inválidas.");
        if (data?.intentos_restantes !== undefined) {
          setIntentosR(data.intentos_restantes);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Llamada directa a la API para obtener el status y body completos
  const loginDirecto = async (email, password) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/usuarios/login/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );
      const data = await res.json();

      if (res.ok) {
        // Guardar tokens manualmente
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        // Recargar el contexto de auth
        await login(email, password);
        return { ok: true };
      }

      return { ok: false, status: res.status, data };
    } catch {
      return { ok: false, status: 500, data: { detail: "Error de conexión." } };
    }
  };

  if (loading) return null;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>G</div>
          <h1 className={styles.title}>Guardería</h1>
          <p className={styles.subtitle}>Iniciá sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="usuario@guarderia.com"
              disabled={bloqueado}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              className={styles.input}
              placeholder="••••••••"
              disabled={bloqueado}
            />
          </div>

          {/* Intentos restantes */}
          {intentosRest !== null && !bloqueado && (
            <div
              style={{
                display: "flex",
                gap: 6,
                justifyContent: "center",
              }}
            >
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background:
                      i < intentosRest ? "var(--color-primary)" : "#F09595",
                    transition: "background .3s",
                  }}
                />
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className={styles.error}
              style={{
                background: bloqueado ? "#FAEEDA" : "#FCEBEB",
                borderColor: bloqueado ? "#FAC775" : "#F09595",
                color: bloqueado ? "#854F0B" : "var(--color-danger)",
              }}
            >
              {bloqueado ? "🔒 " : "⚠️ "}
              {error}
            </div>
          )}

          {/* Countdown */}
          {bloqueado && countdown > 0 && (
            <div
              style={{
                textAlign: "center",
                fontSize: 28,
                fontWeight: 700,
                color: "#854F0B",
                letterSpacing: 2,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatCountdown(countdown)}
            </div>
          )}

          <button
            type="submit"
            className={styles.btn}
            disabled={submitting || bloqueado}
            style={{ opacity: bloqueado ? 0.6 : 1 }}
          >
            {submitting
              ? "Ingresando..."
              : bloqueado
                ? `Bloqueado (${formatCountdown(countdown)})`
                : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
