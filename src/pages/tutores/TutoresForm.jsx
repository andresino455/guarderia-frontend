import { useState } from "react";
import { crearTutorConUsuario, editarTutor } from "../../api/tutoresApi";
import styles from "./Tutores.module.css";

const FORM_INICIAL = {
  nombre: "",
  ci: "",
  telefono: "",
  email: "",
  direccion: "",
  password: "",
};

export default function TutoresForm({ tutor, onGuardado, onCancelar }) {
  const esEditar = Boolean(tutor);

  const [form, setForm] = useState(
    esEditar
      ? {
          nombre: tutor.nombre,
          ci: tutor.ci,
          telefono: tutor.telefono ?? "",
          email: tutor.email ?? "",
          direccion: tutor.direccion ?? "",
          password: "",
        }
      : FORM_INICIAL,
  );
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.nombre || !form.ci) {
      setMsg({ tipo: "err", texto: "Nombre y CI son obligatorios." });
      return;
    }
    if (!esEditar && !form.email) {
      setMsg({
        tipo: "err",
        texto: "El email es obligatorio para crear el usuario.",
      });
      return;
    }
    if (!esEditar && !form.password) {
      setMsg({ tipo: "err", texto: "La contraseña es obligatoria." });
      return;
    }

    setGuardando(true);
    setMsg(null);
    try {
      if (esEditar) {
        const payload = {
          nombre: form.nombre,
          ci: form.ci,
          telefono: form.telefono,
          email: form.email,
          direccion: form.direccion,
        };
        await editarTutor(tutor.id_tutor, payload);
      } else {
        await crearTutorConUsuario(form);
      }
      onGuardado();
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data ?? {})[0]?.[0] ||
        "Error al guardar.";
      setMsg({ tipo: "err", texto: detail });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <div className={styles.modalBody}>
        {msg && (
          <div className={msg.tipo === "ok" ? styles.msgOk : styles.msgErr}>
            {msg.texto}
          </div>
        )}

        <div className={styles.formGrid}>
          <div className={`${styles.formField} ${styles.full}`}>
            <label className={styles.label}>Nombre completo *</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className={styles.input}
              placeholder="Nombre del tutor"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>CI *</label>
            <input
              name="ci"
              value={form.ci}
              onChange={handleChange}
              className={styles.input}
              placeholder="Cédula de identidad"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>Teléfono</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className={styles.input}
              placeholder="Número de contacto"
            />
          </div>

          <div className={`${styles.formField} ${styles.full}`}>
            <label className={styles.label}>Email {!esEditar && "*"}</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className={`${styles.formField} ${styles.full}`}>
            <label className={styles.label}>Dirección</label>
            <textarea
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Dirección de domicilio"
            />
          </div>

          {/* Solo al crear */}
          {!esEditar && (
            <>
              <div
                style={{
                  gridColumn: "1 / -1",
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: 4,
                  fontSize: 12,
                  color: "var(--color-text-muted)",
                }}
              >
                Credenciales de acceso al sistema
              </div>

              <div className={`${styles.formField} ${styles.full}`}>
                <label className={styles.label}>Contraseña *</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.modalFooter}>
        <button className={styles.btnSecondary} onClick={onCancelar}>
          Cancelar
        </button>
        <button
          className={styles.btnPrimary}
          onClick={handleSubmit}
          disabled={guardando}
        >
          {guardando
            ? "Guardando..."
            : esEditar
              ? "Guardar cambios"
              : "Crear tutor"}
        </button>
      </div>
    </>
  );
}
