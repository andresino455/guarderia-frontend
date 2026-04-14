import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  getNinos,
  eliminarNino,
  getTutoresNino,
  getPersonasAutorizadas,
  getSalas,
} from "../../api/ninosApi";
import styles from "./Ninos.module.css";

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

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12C3.8 8.5 7.4 6 12 6C16.6 6 20.2 8.5 22 12C20.2 15.5 16.6 18 12 18C7.4 18 3.8 15.5 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

// ─── Helpers de error (del trabajo 2) ────────────────────────────────────────
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

// ─── Componente principal ─────────────────────────────────────────────────────
export default function NinosList() {
  const navigate = useNavigate();

  const [ninos, setNinos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [tutores, setTutores] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [sala, setSala] = useState(null);
  const [loadDet, setLoadDet] = useState(false);

  // Filtro con useMemo (del trabajo 2 — más eficiente)
  const ninosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return ninos;
    return ninos.filter((n) => n.nombre?.toLowerCase().includes(texto));
  }, [ninos, busqueda]);

  const cargarNinos = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getNinos();
      setNinos(data.results ?? data);
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
    cargarNinos();
  }, [cargarNinos]);

  const abrirDetalle = async (nino) => {
    setDetalle(nino);
    setLoadDet(true);
    setTutores([]);
    setPersonas([]);
    setSala(null);
    try {
      const [t, p, s] = await Promise.all([
        getTutoresNino(nino.id_nino),
        getPersonasAutorizadas(nino.id_nino),
        getSalas(),
      ]);
      setTutores(t.data);
      setPersonas(p.data.results ?? p.data);
      const todasSalas = s.data.results ?? s.data;
      setSala(
        todasSalas.find((sala) =>
          sala.asignaciones?.some((a) => a.id_nino === nino.id_nino),
        ) ?? null,
      );
    } finally {
      setLoadDet(false);
    }
  };

  const cerrarDetalle = () => {
    setDetalle(null);
    setTutores([]);
    setPersonas([]);
    setSala(null);
  };

  // Confirmación con SweetAlert2 (del trabajo 2)
  const handleEliminar = async (id) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar niño?",
      text: "Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    try {
      await eliminarNino(id);
      await Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: "El niño fue eliminado correctamente.",
        confirmButtonColor: "#2563eb",
      });
      cargarNinos();
      if (detalle?.id_nino === id) cerrarDetalle();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: extraerMensajeError(error),
        confirmButtonColor: "#dc2626",
      });
    }
  };

  return (
    <div className={styles.page}>
      {/* Encabezado */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Niños</h1>
          <p
            style={{
              margin: "4px 0 0",
              color: "var(--color-text-muted)",
              fontSize: 14,
            }}
          >
            Administra los niños registrados en el sistema.
          </p>
        </div>
        <button
          className={styles.btnPrimary}
          onClick={() => navigate("/ninos/nuevo")}
        >
          + Nuevo niño
        </button>
      </div>

      {/* Búsqueda */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={styles.searchInput}
        />
        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
          {ninosFiltrados.length} resultado
          {ninosFiltrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Niño</th>
              <th>Fecha de nacimiento</th>
              <th>Edad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && !ninosFiltrados.length && (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  No se encontraron niños.
                </td>
              </tr>
            )}
            {ninosFiltrados.map((n) => (
              <tr key={n.id_nino}>
                <td>
                  <div className={styles.ninoCell}>
                    <div className={styles.avatar}>
                      {n.foto ? (
                        <img src={n.foto} alt={n.nombre} />
                      ) : (
                        n.nombre.charAt(0)
                      )}
                    </div>
                    <div className={styles.ninoNombre}>{n.nombre}</div>
                  </div>
                </td>
                <td>{n.fecha_nacimiento}</td>
                <td>{n.edad ?? "—"} años</td>
                <td>
                  {/* Badge mejorado del trabajo 2 */}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: n.activo ? "#dcfce7" : "#fee2e2",
                      color: n.activo ? "#166534" : "#991b1b",
                    }}
                  >
                    {n.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  {/* Botones con íconos SVG (del trabajo 2) */}
                  <div className={styles.actions}>
                    <button
                      className={styles.btnIcon}
                      onClick={() => abrirDetalle(n)}
                      title="Ver detalle"
                    >
                      <EyeIcon />
                    </button>
                    <button
                      className={styles.btnIcon}
                      onClick={() => navigate(`/ninos/${n.id_nino}/editar`)}
                      title="Editar"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className={styles.btnDanger}
                      onClick={() => handleEliminar(n.id_nino)}
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

      {/* Drawer de detalle (del trabajo 1, sin cambios) */}
      {detalle && (
        <div className={styles.overlay} onClick={cerrarDetalle}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>Detalle del niño</span>
              <button className={styles.btnClose} onClick={cerrarDetalle}>
                ✕
              </button>
            </div>

            <div className={styles.drawerBody}>
              <div className={styles.perfil}>
                <div className={styles.perfilAvatar}>
                  {detalle.foto ? (
                    <img src={detalle.foto} alt={detalle.nombre} />
                  ) : (
                    detalle.nombre.charAt(0)
                  )}
                </div>
                <div>
                  <div className={styles.perfilNombre}>{detalle.nombre}</div>
                  <div className={styles.perfilMeta}>
                    {detalle.edad} años — Nació el {detalle.fecha_nacimiento}
                  </div>
                </div>
              </div>

              {detalle.info_medica && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Info médica</div>
                  <div className={styles.infoMedica}>{detalle.info_medica}</div>
                </div>
              )}

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>Sala asignada</span>
                </div>
                {loadDet && (
                  <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                    Cargando...
                  </p>
                )}
                {!loadDet && sala && (
                  <div className={styles.salaCard}>
                    <span className={styles.salaIcon}>▦</span>
                    <div>
                      <div className={styles.salaNombre}>{sala.nombre}</div>
                      <div className={styles.salaEdades}>
                        {sala.edad_min}–{sala.edad_max} años · {sala.ocupacion}/
                        {sala.cupo_max} niños
                      </div>
                    </div>
                  </div>
                )}
                {!loadDet && !sala && (
                  <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                    Sin sala asignada.
                  </p>
                )}
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>
                    Tutores ({tutores.length})
                  </span>
                  <button
                    className={styles.btnSecondary}
                    style={{ fontSize: 12, padding: "4px 10px" }}
                    onClick={() => navigate(`/ninos/${detalle.id_nino}/editar`)}
                  >
                    + Vincular
                  </button>
                </div>
                {tutores.map((t) => (
                  <div key={t.id_tutor} className={styles.tutorItem}>
                    <div className={styles.tutorInfo}>
                      <span className={styles.tutorNombre}>
                        {t.tutor_nombre}
                      </span>
                      <span className={styles.tutorRel}>
                        {t.relacion ?? "Sin relación definida"}
                      </span>
                    </div>
                  </div>
                ))}
                {!loadDet && !tutores.length && (
                  <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                    Sin tutores vinculados.
                  </p>
                )}
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>
                    Personas autorizadas ({personas.length})
                  </span>
                  <button
                    className={styles.btnSecondary}
                    style={{ fontSize: 12, padding: "4px 10px" }}
                    onClick={() => navigate(`/ninos/${detalle.id_nino}/editar`)}
                  >
                    + Agregar
                  </button>
                </div>
                {personas.map((p) => (
                  <div key={p.id_persona} className={styles.personaItem}>
                    <div className={styles.personaInfo}>
                      <span className={styles.personaNombre}>{p.nombre}</span>
                      <span className={styles.personaCi}>
                        CI: {p.ci} · {p.telefono}
                      </span>
                    </div>
                  </div>
                ))}
                {!loadDet && !personas.length && (
                  <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                    Sin personas autorizadas.
                  </p>
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  className={styles.btnSecondary}
                  onClick={() => navigate(`/ninos/${detalle.id_nino}/editar`)}
                >
                  Editar
                </button>
                <button
                  className={styles.btnDanger}
                  onClick={() => handleEliminar(detalle.id_nino)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
