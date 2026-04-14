import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  getNino,
  crearNino,
  editarNino,
  vincularTutor,
  buscarTutores,
  getTutoresNino,
  getPersonasAutorizadas,
  crearPersonaAutorizada,
  eliminarPersonaAutorizada,
  getSalas,
  asignarSala,
} from "../../api/ninosApi";
import styles from "./Ninos.module.css";

const FORM_INICIAL = {
  nombre: "",
  fecha_nacimiento: "",
  info_medica: "",
  foto: "",
};

const PERSONA_INICIAL = {
  nombre: "",
  ci: "",
  telefono: "",
  codigo_seguridad: "",
};

// ─── Validación del formulario (del trabajo 2) ────────────────────────────────
function validarForm(form) {
  const errors = {};
  if (!form.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
  if (!form.fecha_nacimiento)
    errors.fecha_nacimiento = "La fecha de nacimiento es obligatoria.";
  return errors;
}

// ─── Helper extractor de errores de API (del trabajo 2) ───────────────────────
function extraerMensajeError(error) {
  const data = error?.response?.data;
  const status = error?.response?.status;

  if (status === 500) return "Error interno del servidor. Revisa el backend.";

  if (typeof data === "string") {
    const texto = data.trim();
    if (texto.startsWith("<!DOCTYPE html") || texto.startsWith("<html"))
      return "Error interno del servidor. El backend devolvió una página HTML.";
    return texto || "Ocurrió un error al guardar.";
  }

  if (data?.detail) return data.detail;

  if (data && typeof data === "object") {
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue)) return firstValue[0];
    if (typeof firstValue === "string") return firstValue;
  }

  return "Error al guardar.";
}

export default function NinosForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEditar = Boolean(id);
  const fotoRef = useRef();

  const [form, setForm] = useState(FORM_INICIAL);
  const [errors, setErrors] = useState({}); // validación inline (del trabajo 2)
  const [fotoPreview, setFotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Tutores
  const [tutores, setTutores] = useState([]);
  const [busqTutor, setBusqTutor] = useState("");
  const [resultTutores, setResultTutores] = useState([]);
  const [relacionTutor, setRelacionTutor] = useState("");
  const [tutorElegido, setTutorElegido] = useState(null);
  const [relacionInicial, setRelacionInicial] = useState("");

  // Personas autorizadas
  const [personas, setPersonas] = useState([]);
  const [nuevaPersona, setNuevaPersona] = useState(PERSONA_INICIAL);
  const [mostrarFormPersona, setMostrarFormPersona] = useState(false);

  // Salas
  const [salas, setSalas] = useState([]);
  const [salaElegida, setSalaElegida] = useState("");

  // Cargar datos si es edición
  useEffect(() => {
    getSalas().then(({ data }) => setSalas(data.results ?? data));

    if (!esEditar) return;

    setLoading(true);
    Promise.all([getNino(id), getTutoresNino(id), getPersonasAutorizadas(id)])
      .then(([n, t, p]) => {
        const nino = n.data;
        setForm({
          nombre: nino.nombre,
          fecha_nacimiento: nino.fecha_nacimiento,
          info_medica: nino.info_medica ?? "",
          foto: nino.foto ?? "",
        });
        setFotoPreview(nino.foto ?? null);
        setTutores(t.data);
        setPersonas(p.data.results ?? p.data);
      })
      .finally(() => setLoading(false));
  }, [id, esEditar]);

  // Buscar tutores con debounce
  useEffect(() => {
    if (busqTutor.length < 2) {
      setResultTutores([]);
      return;
    }
    const t = setTimeout(() => {
      buscarTutores(busqTutor).then(({ data }) => setResultTutores(data));
    }, 300);
    return () => clearTimeout(t);
  }, [busqTutor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Limpiar error del campo al escribir (del trabajo 2)
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFotoPreview(ev.target.result);
      setForm((prev) => ({ ...prev, foto: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación inline antes de enviar (del trabajo 2)
    const nuevosErrores = validarForm(form);
    if (Object.keys(nuevosErrores).length > 0) {
      setErrors(nuevosErrores);
      return;
    }

    setMsg(null);
    setLoading(true);
    try {
      let ninoId = id;
      if (esEditar) {
        await editarNino(id, form);
      } else {
        const { data } = await crearNino(form);
        ninoId = data.id_nino;
        if (tutorElegido) {
          await vincularTutor(ninoId, {
            id_tutor: tutorElegido.id_tutor,
            relacion: relacionInicial,
          });
        }
      }

      if (salaElegida) {
        await asignarSala(salaElegida, { id_nino: ninoId });
      }

      // SweetAlert2 en lugar de mensaje inline (del trabajo 2)
      await Swal.fire({
        icon: "success",
        title: "Éxito",
        text: esEditar
          ? "Niño actualizado correctamente."
          : "Niño creado correctamente.",
        confirmButtonColor: "#2563eb",
        timer: 1800,
        showConfirmButton: false,
      });
      navigate("/ninos");
    } catch (err) {
      const detail = extraerMensajeError(err);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: detail,
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVincularTutor = async (tutor) => {
    if (!id) {
      setMsg({
        tipo: "err",
        texto: "Primero guardá el niño para vincular tutores.",
      });
      return;
    }
    try {
      await vincularTutor(id, {
        id_tutor: tutor.id_tutor,
        relacion: relacionTutor,
      });
      const { data } = await getTutoresNino(id);
      setTutores(data);
      setBusqTutor("");
      setRelacionTutor("");
      setResultTutores([]);
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: extraerMensajeError(err),
        confirmButtonColor: "#dc2626",
      });
    }
  };

  const handleAgregarPersona = async () => {
    if (
      !nuevaPersona.nombre ||
      !nuevaPersona.ci ||
      !nuevaPersona.codigo_seguridad
    ) {
      setMsg({
        tipo: "err",
        texto: "Nombre, CI y código de seguridad son obligatorios.",
      });
      return;
    }
    if (!id) {
      setMsg({
        tipo: "err",
        texto: "Primero guardá el niño para agregar personas autorizadas.",
      });
      return;
    }
    try {
      await crearPersonaAutorizada({ ...nuevaPersona, id_nino: id });
      const { data } = await getPersonasAutorizadas(id);
      setPersonas(data.results ?? data);
      setNuevaPersona(PERSONA_INICIAL);
      setMostrarFormPersona(false);
    } catch (err) {
      setMsg({ tipo: "err", texto: extraerMensajeError(err) });
    }
  };

  const handleEliminarPersona = async (idPersona) => {
    await eliminarPersonaAutorizada(idPersona);
    setPersonas((prev) => prev.filter((p) => p.id_persona !== idPersona));
  };

  if (loading && esEditar)
    return (
      <div style={{ padding: 40, color: "var(--color-text-muted)" }}>
        Cargando...
      </div>
    );

  return (
    <div className={styles.formPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          {esEditar ? "Editar niño" : "Nuevo niño"}
        </h1>
        <button
          className={styles.btnSecondary}
          onClick={() => navigate("/ninos")}
        >
          ← Volver
        </button>
      </div>

      {/* Mensajes locales (solo para personas autorizadas, el resto usa Swal) */}
      {msg && (
        <div className={msg.tipo === "ok" ? styles.msgOk : styles.msgErr}>
          {msg.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "contents" }}>
        {/* Datos básicos */}
        <div className={styles.formCard}>
          <div className={styles.formCardTitle}>Datos básicos</div>

          {/* Foto */}
          <div className={styles.fotoBox}>
            <div className={styles.fotoPreview}>
              {fotoPreview ? (
                <img src={fotoPreview} alt="foto" />
              ) : (
                form.nombre?.charAt(0) || "?"
              )}
            </div>
            <div className={styles.fotoActions}>
              <button
                type="button"
                className={styles.fotoBtn}
                onClick={() => fotoRef.current.click()}
              >
                Subir foto
              </button>
              {fotoPreview && (
                <button
                  type="button"
                  className={styles.fotoBtn}
                  onClick={() => {
                    setFotoPreview(null);
                    setForm((p) => ({ ...p, foto: "" }));
                  }}
                >
                  Quitar foto
                </button>
              )}
              <input
                ref={fotoRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFoto}
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={`${styles.formField} ${styles.full}`}>
              <label className={styles.label}>Nombre completo *</label>
              <input
                name="nombre"
                required
                value={form.nombre}
                onChange={handleChange}
                className={styles.input}
                placeholder="Nombre del niño"
                style={errors.nombre ? { borderColor: "#dc2626" } : {}}
              />
              {/* Error inline (del trabajo 2) */}
              {errors.nombre && (
                <span style={{ color: "#dc2626", fontSize: 12 }}>
                  {errors.nombre}
                </span>
              )}
            </div>

            <div className={styles.formField}>
              <label className={styles.label}>Fecha de nacimiento *</label>
              <input
                name="fecha_nacimiento"
                type="date"
                required
                value={form.fecha_nacimiento}
                onChange={handleChange}
                className={styles.input}
                style={
                  errors.fecha_nacimiento ? { borderColor: "#dc2626" } : {}
                }
              />
              {errors.fecha_nacimiento && (
                <span style={{ color: "#dc2626", fontSize: 12 }}>
                  {errors.fecha_nacimiento}
                </span>
              )}
            </div>

            <div className={`${styles.formField} ${styles.full}`}>
              <label className={styles.label}>Información médica</label>
              <textarea
                name="info_medica"
                value={form.info_medica}
                onChange={handleChange}
                className={styles.textarea}
                placeholder="Alergias, condiciones especiales, medicamentos..."
              />
            </div>
          </div>
        </div>

        {/* Sala */}
        <div className={styles.formCard}>
          <div className={styles.formCardTitle}>Sala asignada</div>
          <div className={styles.formField}>
            <label className={styles.label}>Asignar a sala</label>
            <select
              value={salaElegida}
              onChange={(e) => setSalaElegida(e.target.value)}
              className={styles.select}
            >
              <option value="">— Sin asignar —</option>
              {salas.map((s) => (
                <option key={s.id_sala} value={s.id_sala}>
                  {s.nombre} ({s.edad_min}–{s.edad_max} años) ·{" "}
                  {s.cupo_disponible} lugares disponibles
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tutor */}
        <div className={styles.formCard}>
          <div className={styles.formCardTitle}>
            {esEditar ? "Tutores vinculados" : "Vincular tutor"}
          </div>

          {esEditar &&
            tutores.map((t) => (
              <div key={t.id_tutor} className={styles.tutorItem}>
                <div className={styles.tutorInfo}>
                  <span className={styles.tutorNombre}>{t.tutor_nombre}</span>
                  <span className={styles.tutorRel}>{t.relacion ?? "—"}</span>
                </div>
              </div>
            ))}
          {esEditar && !tutores.length && (
            <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              Sin tutores vinculados.
            </p>
          )}

          {!esEditar && tutorElegido && (
            <div className={styles.tutorItem} style={{ marginBottom: 12 }}>
              <div className={styles.tutorInfo}>
                <span className={styles.tutorNombre}>
                  {tutorElegido.nombre}
                </span>
                <span className={styles.tutorRel}>
                  CI: {tutorElegido.ci}
                  {relacionInicial && ` · ${relacionInicial}`}
                </span>
              </div>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => {
                  setTutorElegido(null);
                  setRelacionInicial("");
                }}
              >
                Quitar
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className={styles.label}>
              {esEditar ? "Buscar tutor para vincular" : "Buscar tutor"}
            </label>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="Nombre del tutor..."
                value={busqTutor}
                onChange={(e) => setBusqTutor(e.target.value)}
                className={styles.input}
                style={{ flex: 1 }}
              />
              <input
                type="text"
                placeholder="Relación (ej: madre)"
                value={relacionTutor}
                onChange={(e) => setRelacionTutor(e.target.value)}
                className={styles.input}
                style={{ width: 160 }}
              />
            </div>

            <div className={styles.searchResults}>
              {resultTutores.map((t) => (
                <div key={t.id_tutor} className={styles.searchResultItem}>
                  <div>
                    <span style={{ fontWeight: 500 }}>{t.nombre}</span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--color-text-muted)",
                        marginLeft: 8,
                      }}
                    >
                      CI: {t.ci}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.btnAdd}
                    onClick={() => {
                      if (esEditar) {
                        handleVincularTutor(t);
                      } else {
                        setTutorElegido(t);
                        setRelacionInicial(relacionTutor);
                        setBusqTutor("");
                        setRelacionTutor("");
                        setResultTutores([]);
                      }
                    }}
                  >
                    {esEditar ? "Vincular" : "Elegir"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botón guardar */}
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => navigate("/ninos")}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={loading}
          >
            {loading
              ? "Guardando..."
              : esEditar
                ? "Guardar cambios"
                : "Crear niño"}
          </button>
        </div>
      </form>

      {/* Personas autorizadas — solo en edición */}
      {esEditar && (
        <div className={styles.formCard}>
          <div className={styles.formCardTitle}>Personas autorizadas</div>

          {personas.map((p) => (
            <div key={p.id_persona} className={styles.personaItem}>
              <div className={styles.personaInfo}>
                <span className={styles.personaNombre}>{p.nombre}</span>
                <span className={styles.personaCi}>
                  CI: {p.ci} · {p.telefono}
                </span>
              </div>
              <button
                className={styles.btnDanger}
                onClick={() => handleEliminarPersona(p.id_persona)}
              >
                Quitar
              </button>
            </div>
          ))}
          {!personas.length && (
            <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              Sin personas autorizadas.
            </p>
          )}

          {!mostrarFormPersona && (
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setMostrarFormPersona(true)}
              style={{ alignSelf: "flex-start", marginTop: 8 }}
            >
              + Agregar persona autorizada
            </button>
          )}

          {mostrarFormPersona && (
            <div className={styles.miniForm}>
              {[
                {
                  label: "Nombre *",
                  key: "nombre",
                  placeholder: "Nombre completo",
                },
                {
                  label: "CI *",
                  key: "ci",
                  placeholder: "Cédula de identidad",
                },
                {
                  label: "Teléfono",
                  key: "telefono",
                  placeholder: "Número de contacto",
                },
                {
                  label: "Código de seguridad *",
                  key: "codigo_seguridad",
                  placeholder: "Código para verificar identidad",
                },
              ].map(({ label, key, placeholder }) => (
                <div className={styles.formField} key={key}>
                  <label className={styles.label}>{label}</label>
                  <input
                    value={nuevaPersona[key]}
                    onChange={(e) =>
                      setNuevaPersona((p) => ({ ...p, [key]: e.target.value }))
                    }
                    className={styles.input}
                    placeholder={placeholder}
                  />
                </div>
              ))}

              <div className={`${styles.formActions} ${styles.full}`}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => {
                    setMostrarFormPersona(false);
                    setNuevaPersona(PERSONA_INICIAL);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleAgregarPersona}
                >
                  Guardar persona
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
