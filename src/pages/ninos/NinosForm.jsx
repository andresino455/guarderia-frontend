import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

export default function NinosForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEditar = Boolean(id);
  const fotoRef = useRef();

  const [form, setForm] = useState(FORM_INICIAL);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Tutores
  const [tutores, setTutores] = useState([]);
  const [busqTutor, setBusqTutor] = useState("");
  const [resultTutores, setResultTutores] = useState([]);
  const [relacionTutor, setRelacionTutor] = useState("");
  // Agregar junto a los otros estados al inicio del componente
  const [tutorElegido, setTutorElegido] = useState(null);
  const [relacionInicial, setRelacionInicial] = useState("");

  // Personas autorizadas
  const [personas, setPersonas] = useState([]);
  const [nuevaPersona, setNuevaPersona] = useState(PERSONA_INICIAL);
  const [mostrarFormPersona, setMostrarFormPersona] = useState(false);

  // Salas
  const [salas, setSalas] = useState([]);
  const [salaActual, setSalaActual] = useState(null);
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

  // Buscar tutores en tiempo real
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
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
    setMsg(null);
    setLoading(true);
    try {
      let ninoId = id;
      if (esEditar) {
        await editarNino(id, form);
      } else {
        const { data } = await crearNino(form);
        ninoId = data.id_nino;

        // Vincular tutor preseleccionado si se eligió uno
        if (tutorElegido) {
          await vincularTutor(ninoId, {
            id_tutor: tutorElegido.id_tutor,
            relacion: relacionInicial,
          });
        }
      }

      // Asignar sala si se eligió una
      if (salaElegida) {
        await asignarSala(salaElegida, { id_nino: ninoId });
      }

      setMsg({
        tipo: "ok",
        texto: esEditar ? "Niño actualizado." : "Niño creado correctamente.",
      });
      setTimeout(() => navigate("/ninos"), 1200);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data ?? {})[0]?.[0] ||
        "Error al guardar.";
      setMsg({ tipo: "err", texto: detail });
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
    } catch {
      setMsg({ tipo: "err", texto: "No se pudo vincular el tutor." });
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
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data ?? {})[0]?.[0] ||
        "Error al agregar.";
      setMsg({ tipo: "err", texto: detail });
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
              />
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
              />
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

        {/* Tutor — disponible al crear Y al editar */}
        <div className={styles.formCard}>
          <div className={styles.formCardTitle}>
            {esEditar ? "Tutores vinculados" : "Vincular tutor"}
          </div>

          {/* Tutores ya vinculados (solo edición) */}
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

          {/* Tutor preseleccionado (solo creación) */}
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

          {/* Buscador */}
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
                        // En creación solo guardamos la selección
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

      {/* Vincular tutores — solo en edición */}
      {esEditar && (
        <div className={styles.formCard}>
          <div className={styles.formCardTitle}>Tutores vinculados</div>

          {tutores.map((t) => (
            <div key={t.id_tutor} className={styles.tutorItem}>
              <div className={styles.tutorInfo}>
                <span className={styles.tutorNombre}>{t.tutor_nombre}</span>
                <span className={styles.tutorRel}>{t.relacion ?? "—"}</span>
              </div>
            </div>
          ))}
          {!tutores.length && (
            <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              Sin tutores vinculados.
            </p>
          )}

          <div
            style={{
              marginTop: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <label className={styles.label}>Buscar tutor para vincular</label>
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
                  <span>
                    {t.nombre} — CI: {t.ci}
                  </span>
                  <button
                    type="button"
                    className={styles.btnAdd}
                    onClick={() => handleVincularTutor(t)}
                  >
                    Vincular
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Personas autorizadas — solo en edición */}
      {esEditar && (
        <div className={styles.formCard}>
          <div className={styles.formCardTitle}>
            Personas autorizadas a recoger
          </div>

          {personas.map((p) => (
            <div key={p.id_persona} className={styles.personaItem}>
              <div className={styles.personaInfo}>
                <span className={styles.personaNombre}>{p.nombre}</span>
                <span className={styles.personaCi}>
                  CI: {p.ci} · {p.telefono}
                </span>
              </div>
              <button
                type="button"
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
              <div className={styles.formField}>
                <label className={styles.label}>Nombre *</label>
                <input
                  value={nuevaPersona.nombre}
                  onChange={(e) =>
                    setNuevaPersona((p) => ({ ...p, nombre: e.target.value }))
                  }
                  className={styles.input}
                  placeholder="Nombre completo"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>CI *</label>
                <input
                  value={nuevaPersona.ci}
                  onChange={(e) =>
                    setNuevaPersona((p) => ({ ...p, ci: e.target.value }))
                  }
                  className={styles.input}
                  placeholder="Cédula de identidad"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Teléfono</label>
                <input
                  value={nuevaPersona.telefono}
                  onChange={(e) =>
                    setNuevaPersona((p) => ({ ...p, telefono: e.target.value }))
                  }
                  className={styles.input}
                  placeholder="Número de contacto"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Código de seguridad *</label>
                <input
                  value={nuevaPersona.codigo_seguridad}
                  onChange={(e) =>
                    setNuevaPersona((p) => ({
                      ...p,
                      codigo_seguridad: e.target.value,
                    }))
                  }
                  className={styles.input}
                  placeholder="Código para verificar identidad"
                />
              </div>
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
