import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNinos,
  eliminarNino,
  getTutoresNino,
  getPersonasAutorizadas,
} from "../../api/ninosApi";
import { getSalas } from "../../api/ninosApi";
import styles from "./Ninos.module.css";

export default function NinosList() {
  const navigate = useNavigate();

  const [ninos, setNinos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState(null); // niño seleccionado
  const [tutores, setTutores] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [sala, setSala] = useState(null);
  const [loadDet, setLoadDet] = useState(false);

  const cargarNinos = useCallback(() => {
    setLoading(true);
    getNinos()
      .then(({ data }) => setNinos(data.results ?? data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    cargarNinos();
  }, [cargarNinos]);

  // Filtro local por búsqueda
  const ninosFiltrados = ninos.filter((n) =>
    n.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  );

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

      // Buscar sala asignada al niño
      const todasSalas = s.data.results ?? s.data;
      const salaAsig = todasSalas.find((sala) =>
        sala.asignaciones?.some((a) => a.id_nino === nino.id_nino),
      );
      setSala(salaAsig ?? null);
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

  const handleEliminar = async (id) => {
    if (!confirm("¿Seguro que querés eliminar este niño?")) return;
    await eliminarNino(id);
    cargarNinos();
    if (detalle?.id_nino === id) cerrarDetalle();
  };

  return (
    <div className={styles.page}>
      {/* Encabezado */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Niños</h1>
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
                    <div>
                      <div className={styles.ninoNombre}>{n.nombre}</div>
                    </div>
                  </div>
                </td>
                <td>{n.fecha_nacimiento}</td>
                <td>{n.edad ?? "—"} años</td>
                <td>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      padding: "3px 8px",
                      borderRadius: 10,
                      background: n.activo ? "#EAF3DE" : "#F1EFE8",
                      color: n.activo ? "#3B6D11" : "#5F5E5A",
                    }}
                  >
                    {n.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.btnIcon}
                      onClick={() => abrirDetalle(n)}
                    >
                      Ver
                    </button>
                    <button
                      className={styles.btnIcon}
                      onClick={() => navigate(`/ninos/${n.id_nino}/editar`)}
                    >
                      Editar
                    </button>
                    <button
                      className={styles.btnDanger}
                      onClick={() => handleEliminar(n.id_nino)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer de detalle */}
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
              {/* Perfil */}
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

              {/* Info médica */}
              {detalle.info_medica && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Info médica</div>
                  <div className={styles.infoMedica}>{detalle.info_medica}</div>
                </div>
              )}

              {/* Sala asignada */}
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

              {/* Tutores */}
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

              {/* Personas autorizadas */}
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

              {/* Acciones */}
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
