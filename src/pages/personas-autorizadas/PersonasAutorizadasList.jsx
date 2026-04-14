import { useEffect, useState, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import {
  getPersonasAutorizadas,
  crearPersonaAutorizada,
  editarPersonaAutorizada,
  eliminarPersonaAutorizada,
  verificarPersona,
  generarCodigoPersonaAutorizada,
  getNinos,
} from "../../api/personasAutorizadasApi";
import styles from "./PersonasAutorizadas.module.css";

// ─── Íconos SVG (del trabajo 2) ───────────────────────────────────────────────
function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 20H8L18.5 9.5C19.3 8.7 19.3 7.3 18.5 6.5L17.5 5.5C16.7 4.7 15.3 4.7 14.5 5.5L4 16V20Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 6H21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 6V4C8 3.4 8.4 3 9 3H15C15.6 3 16 3.4 16 4V6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M19 6L18.3 18.1C18.2 19.2 17.3 20 16.2 20H7.8C6.7 20 5.8 19.2 5.7 18.1L5 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 11V17M14 11V17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 11A8 8 0 1 0 18.2 16.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 4V11H13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Helper errores (del trabajo 2) ──────────────────────────────────────────
function extraerMensajeError(error) {
  const data = error?.response?.data;
  const status = error?.response?.status;
  if (status === 500) return "Error interno del servidor. Revisa el backend.";
  if (typeof data === "string") {
    const texto = data.trim();
    if (texto.startsWith("<!DOCTYPE html") || texto.startsWith("<html"))
      return "Error interno del servidor. El backend devolvió una página HTML.";
    return texto || "Ocurrió un error.";
  }
  if (data?.detail) return data.detail;
  if (data && typeof data === "object") {
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue)) return firstValue[0];
    if (typeof firstValue === "string") return firstValue;
  }
  return "Ocurrió un error inesperado.";
}

// ─── Mensaje de creación con código (del trabajo 2) ───────────────────────────
function construirMensajeCreacion(resp) {
  const codigo = resp?.codigo_seguridad;
  const enviados = resp?.correo?.enviados;
  if (codigo && typeof enviados === "number" && enviados > 0)
    return {
      mensaje: `Persona creada. Código generado: ${codigo}`,
      footer: `Código enviado al tutor por correo (${enviados}).`,
    };
  if (codigo)
    return {
      mensaje: `Persona creada. Código generado: ${codigo}`,
      footer: "El código fue procesado por el sistema.",
    };
  if (typeof enviados === "number" && enviados > 0)
    return {
      mensaje: "Persona autorizada creada correctamente.",
      footer: `Código enviado al tutor por correo (${enviados}).`,
    };
  return {
    mensaje: "Persona autorizada creada correctamente.",
    footer: "Si el tutor tiene correo, el código fue enviado automáticamente.",
  };
}

const waitForUi = () => new Promise((resolve) => setTimeout(resolve, 0));

const FORM_INICIAL = {
  nombre: "",
  ci: "",
  telefono: "",
  id_nino: "",
};
const VERIFICAR_INIC = { ci: "", codigo_seguridad: "" };

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PersonasAutorizadasList() {
  const [tab, setTab] = useState("lista"); // 'lista' | 'verificar'
  const [personas, setPersonas] = useState([]);
  const [ninos, setNinos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroNino, setFiltroNino] = useState("");
  const [regenerandoId, setRegenerandoId] = useState(null);

  // Modal crear/editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Verificador
  const [verificar, setVerificar] = useState(VERIFICAR_INIC);
  const [resultado, setResultado] = useState(null);
  const [verificando, setVerificando] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [p, n] = await Promise.all([getPersonasAutorizadas(), getNinos()]);
      setPersonas(p.data.results ?? p.data);
      setNinos(n.data.results ?? n.data);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: extraerMensajeError(error),
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Filtro con useMemo + búsqueda ampliada (nombre, CI, código, niño — del trabajo 2)
  const personasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return personas.filter((p) => {
      const matchBusq =
        !texto ||
        p.nombre?.toLowerCase().includes(texto) ||
        p.ci?.toLowerCase().includes(texto) ||
        p.telefono?.toLowerCase().includes(texto) ||
        (p.nino_nombre ?? nombreNino(p.id_nino))
          ?.toLowerCase()
          .includes(texto) ||
        p.codigo_seguridad?.toLowerCase().includes(texto);
      const matchNino = filtroNino ? String(p.id_nino) === filtroNino : true;
      return matchBusq && matchNino;
    });
  }, [personas, busqueda, filtroNino]);

  const nombreNino = (id_nino) =>
    ninos.find((n) => n.id_nino === id_nino)?.nombre ?? "—";

  // ── Modal helpers ────────────────────────────────────────────────────────────
  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setErrors({});
    setErrorMsg("");
    setModalAbierto(true);
  };

  const abrirEditar = (persona) => {
    setEditando(persona);
    setForm({
      nombre: persona.nombre,
      ci: persona.ci,
      telefono: persona.telefono ?? "",
      id_nino: String(persona.id_nino),
    });
    setErrors({});
    setErrorMsg("");
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditando(null);
    setForm(FORM_INICIAL);
    setErrors({});
    setErrorMsg("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (errorMsg) setErrorMsg("");
  };

  // Validación inline (del trabajo 2)
  const validate = () => {
    const newErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = "El nombre es obligatorio.";
    if (!form.ci.trim()) newErrors.ci = "El CI es obligatorio.";
    if (!String(form.id_nino).trim())
      newErrors.id_nino = "Debes seleccionar un niño.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!validate()) return;
    setGuardando(true);
    setErrorMsg("");
    try {
      const payload = {
        id_nino: Number(form.id_nino),
        nombre: form.nombre.trim(),
        ci: form.ci.trim(),
        telefono: form.telefono.trim(),
      };

      if (editando) {
        await editarPersonaAutorizada(editando.id_persona, payload);
        cerrarModal();
        await cargarDatos();
        await waitForUi();
        await Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Persona autorizada actualizada correctamente.",
          confirmButtonColor: "#2563eb",
        });
      } else {
        const { data: resp } = await crearPersonaAutorizada(payload);
        const info = construirMensajeCreacion(resp); // muestra código + correo
        cerrarModal();
        await cargarDatos();
        await waitForUi();
        await Swal.fire({
          icon: "success",
          title: "Éxito",
          text: info.mensaje,
          footer: info.footer,
          confirmButtonColor: "#2563eb",
        });
      }
    } catch (err) {
      setErrorMsg(extraerMensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar persona autorizada?",
      text: "Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });
    if (!result.isConfirmed) return;
    try {
      await eliminarPersonaAutorizada(id);
      await waitForUi();
      await Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: "La persona autorizada fue eliminada correctamente.",
        confirmButtonColor: "#2563eb",
      });
      cargarDatos();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: extraerMensajeError(error),
        confirmButtonColor: "#dc2626",
      });
    }
  };

  // Regenerar código (del trabajo 2, adaptado a la API unificada)
  const handleRegenerarCodigo = async (persona) => {
    const result = await Swal.fire({
      icon: "question",
      title: "¿Generar nuevo código?",
      text: `Se reemplazará el código actual de ${persona.nombre}.`,
      showCancelButton: true,
      confirmButtonText: "Sí, generar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#64748b",
    });
    if (!result.isConfirmed) return;
    try {
      setRegenerandoId(persona.id_persona);
      const { data: resp } = await generarCodigoPersonaAutorizada(
        persona.id_persona,
      );
      const codigo = resp?.codigo_seguridad || "generado correctamente";
      const enviados = resp?.correo?.enviados;
      const footer =
        typeof enviados === "number" && enviados > 0
          ? `El nuevo código fue enviado al tutor por correo (${enviados}).`
          : "Si el tutor tiene correo registrado, el código fue enviado automáticamente.";
      await cargarDatos();
      await waitForUi();
      await Swal.fire({
        icon: "success",
        title: "Código regenerado",
        text: `Nuevo código: ${codigo}`,
        footer,
        confirmButtonColor: "#2563eb",
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: extraerMensajeError(error),
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setRegenerandoId(null);
    }
  };

  const handleVerificar = async () => {
    if (!verificar.ci || !verificar.codigo_seguridad) return;
    setVerificando(true);
    setResultado(null);
    try {
      const { data } = await verificarPersona(verificar);
      setResultado({ ok: true, ...data });
    } catch {
      setResultado({ ok: false });
    } finally {
      setVerificando(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Encabezado */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Personas autorizadas</h1>
          <p
            style={{
              margin: "4px 0 0",
              color: "var(--color-text-muted)",
              fontSize: 14,
            }}
          >
            Administra las personas autorizadas registradas en el sistema.
          </p>
        </div>
        {tab === "lista" && (
          <button className={styles.btnPrimary} onClick={abrirCrear}>
            + Nueva persona
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "lista" ? styles.active : ""}`}
          onClick={() => setTab("lista")}
        >
          Lista
        </button>
        <button
          className={`${styles.tab} ${tab === "verificar" ? styles.active : ""}`}
          onClick={() => {
            setTab("verificar");
            setResultado(null);
          }}
        >
          Verificar identidad
        </button>
      </div>

      {/* ── TAB LISTA ── */}
      {tab === "lista" && (
        <>
          <div className={styles.filters}>
            <input
              type="text"
              placeholder="Buscar por nombre, CI, código o niño..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={styles.searchInput}
            />
            <select
              value={filtroNino}
              onChange={(e) => setFiltroNino(e.target.value)}
              className={styles.select}
            >
              <option value="">Todos los niños</option>
              {ninos.map((n) => (
                <option key={n.id_nino} value={String(n.id_nino)}>
                  {n.nombre}
                </option>
              ))}
            </select>
            <span
              style={{
                fontSize: 13,
                color: "var(--color-text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              {personasFiltradas.length} resultado
              {personasFiltradas.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>CI</th>
                  <th>Teléfono</th>
                  <th>Niño autorizado</th>
                  <th>Código</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className={styles.empty}>
                      Cargando...
                    </td>
                  </tr>
                )}
                {!loading && !personasFiltradas.length && (
                  <tr>
                    <td colSpan={7} className={styles.empty}>
                      No se encontraron personas autorizadas.
                    </td>
                  </tr>
                )}
                {personasFiltradas.map((p) => (
                  <tr key={p.id_persona}>
                    <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                    <td>{p.ci}</td>
                    <td>{p.telefono ?? "—"}</td>
                    <td>
                      <span className={styles.ninoBadge}>
                        ◉ {p.nino_nombre ?? nombreNino(p.id_nino)}
                      </span>
                    </td>
                    {/* Columna código (del trabajo 2) */}
                    <td>
                      <code
                        style={{
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          padding: "4px 8px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {p.codigo_seguridad || "—"}
                      </code>
                    </td>
                    {/* Badge activo/inactivo (del trabajo 2) */}
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          background: p.activo ? "#dcfce7" : "#fee2e2",
                          color: p.activo ? "#166534" : "#991b1b",
                        }}
                      >
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.btnIcon}
                          onClick={() => abrirEditar(p)}
                          disabled={regenerandoId === p.id_persona}
                          title="Editar"
                        >
                          <EditIcon />
                        </button>
                        {/* Botón regenerar código (del trabajo 2) */}
                        <button
                          className={styles.btnIcon}
                          style={{ color: "#7c3aed" }}
                          onClick={() => handleRegenerarCodigo(p)}
                          disabled={regenerandoId === p.id_persona}
                          title="Regenerar código"
                        >
                          {regenerandoId === p.id_persona ? (
                            "..."
                          ) : (
                            <RefreshIcon />
                          )}
                        </button>
                        <button
                          className={styles.btnDanger}
                          onClick={() => handleEliminar(p.id_persona)}
                          disabled={regenerandoId === p.id_persona}
                          title="Eliminar"
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── TAB VERIFICAR ── */}
      {tab === "verificar" && (
        <div className={styles.verificarCard}>
          <div>
            <p className={styles.verificarTitle}>Verificar identidad</p>
            <p className={styles.verificarDesc}>
              Ingresá el CI y el código de seguridad para confirmar si una
              persona está autorizada a recoger a un niño.
            </p>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.label}>Cédula de identidad</label>
              <input
                type="text"
                placeholder="CI de la persona"
                value={verificar.ci}
                onChange={(e) =>
                  setVerificar((p) => ({ ...p, ci: e.target.value }))
                }
                className={styles.input}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Código de seguridad</label>
              <input
                type="password"
                placeholder="Código"
                value={verificar.codigo_seguridad}
                onChange={(e) =>
                  setVerificar((p) => ({
                    ...p,
                    codigo_seguridad: e.target.value,
                  }))
                }
                className={styles.input}
              />
            </div>
          </div>

          <button
            className={styles.btnPrimary}
            onClick={handleVerificar}
            disabled={
              verificando || !verificar.ci || !verificar.codigo_seguridad
            }
            style={{ alignSelf: "flex-start" }}
          >
            {verificando ? "Verificando..." : "Verificar"}
          </button>

          {resultado?.ok && (
            <div className={styles.resultadoOk}>
              <span className={styles.resultadoLabel}>✓ Autorizado</span>
              <span className={styles.resultadoNombre}>{resultado.nombre}</span>
              <span className={styles.resultadoNino}>
                Autorizado para recoger a: <strong>{resultado.nino}</strong>
              </span>
            </div>
          )}
          {resultado && !resultado.ok && (
            <div className={styles.resultadoErr}>
              <span className={styles.resultadoLabel}>✗ No autorizado</span>
              <span className={styles.resultadoNombre}>
                Identidad no verificada
              </span>
              <span className={styles.resultadoNino}>
                CI o código de seguridad incorrectos.
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL CREAR / EDITAR ── */}
      {modalAbierto && (
        <div className={styles.overlay} onClick={cerrarModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalTitle}>
                  {editando
                    ? "Editar persona autorizada"
                    : "Nueva persona autorizada"}
                </span>
                {/* Info sobre el código (del trabajo 2) */}
                <p
                  style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}
                >
                  {editando
                    ? "Podés regenerar el código desde la lista — se enviará automáticamente al tutor."
                    : "Al crear, el código se enviará automáticamente al tutor por correo."}
                </p>
              </div>
              <button className={styles.btnClose} onClick={cerrarModal}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {errorMsg && <div className={styles.msgErr}>{errorMsg}</div>}

              <div className={styles.formGrid}>
                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Nombre completo *</label>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className={styles.input}
                    style={errors.nombre ? { borderColor: "#dc2626" } : {}}
                    placeholder="Nombre de la persona"
                  />
                  {errors.nombre && (
                    <span style={{ color: "#dc2626", fontSize: 12 }}>
                      {errors.nombre}
                    </span>
                  )}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>CI *</label>
                  <input
                    name="ci"
                    value={form.ci}
                    onChange={handleChange}
                    className={styles.input}
                    style={errors.ci ? { borderColor: "#dc2626" } : {}}
                    placeholder="Cédula de identidad"
                  />
                  {errors.ci && (
                    <span style={{ color: "#dc2626", fontSize: 12 }}>
                      {errors.ci}
                    </span>
                  )}
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
                  <label className={styles.label}>Niño autorizado *</label>
                  <select
                    name="id_nino"
                    value={form.id_nino}
                    onChange={handleChange}
                    className={styles.input}
                    style={errors.id_nino ? { borderColor: "#dc2626" } : {}}
                  >
                    <option value="">— Seleccioná un niño —</option>
                    {ninos.map((n) => (
                      <option key={n.id_nino} value={String(n.id_nino)}>
                        {n.nombre} {n.edad ? `(${n.edad} años)` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.id_nino && (
                    <span style={{ color: "#dc2626", fontSize: 12 }}>
                      {errors.id_nino}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={cerrarModal}>
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleGuardar}
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : editando
                    ? "Guardar cambios"
                    : "Crear y enviar código"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
