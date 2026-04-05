import { useEffect, useState, useCallback } from "react";
import { getTutores, eliminarTutor, getNinosTutor } from "../../api/tutoresApi";
import TutoresForm from "./TutoresForm";
import styles from "./Tutores.module.css";

export default function TutoresList() {
  const [tutores, setTutores] = useState([]);
  const [ninosPorTutor, setNinosPorTutor] = useState({}); // { id_tutor: [ninos] }
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [ninosDetalle, setNinosDetalle] = useState([]);
  const [loadDet, setLoadDet] = useState(false);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [msg, setMsg] = useState(null);

  const cargarTutores = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getTutores();
      const lista = data.results ?? data;
      setTutores(lista);

      // Cargar niños de todos los tutores en paralelo
      const resultados = await Promise.all(
        lista.map((t) =>
          getNinosTutor(t.id_tutor)
            .then((r) => ({ id: t.id_tutor, ninos: r.data }))
            .catch(() => ({ id: t.id_tutor, ninos: [] })),
        ),
      );
      const mapa = {};
      resultados.forEach((r) => {
        mapa[r.id] = r.ninos;
      });
      setNinosPorTutor(mapa);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarTutores();
  }, [cargarTutores]);

  const tutoresFiltrados = tutores.filter(
    (t) =>
      t.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.ci?.includes(busqueda) ||
      t.email?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const abrirDetalle = async (tutor) => {
    setDetalle(tutor);
    setLoadDet(true);
    // Si ya los tenemos cargados, usarlos directo
    if (ninosPorTutor[tutor.id_tutor]) {
      setNinosDetalle(ninosPorTutor[tutor.id_tutor]);
      setLoadDet(false);
    } else {
      try {
        const { data } = await getNinosTutor(tutor.id_tutor);
        setNinosDetalle(data);
      } finally {
        setLoadDet(false);
      }
    }
  };

  const cerrarDetalle = () => {
    setDetalle(null);
    setNinosDetalle([]);
  };

  const abrirCrear = () => {
    setEditando(null);
    setMsg(null);
    setModal(true);
  };

  const abrirEditar = (tutor) => {
    setEditando(tutor);
    setMsg(null);
    setModal(true);
    cerrarDetalle();
  };

  const cerrarModal = () => {
    setModal(false);
    setEditando(null);
  };

  const handleGuardado = () => {
    cargarTutores();
    cerrarModal();
    setMsg({
      tipo: "ok",
      texto: editando ? "Tutor actualizado." : "Tutor creado correctamente.",
    });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este tutor?")) return;
    await eliminarTutor(id);
    cargarTutores();
    if (detalle?.id_tutor === id) cerrarDetalle();
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Tutores</h1>
        <button className={styles.btnPrimary} onClick={abrirCrear}>
          + Nuevo tutor
        </button>
      </div>

      {msg && (
        <div className={msg.tipo === "ok" ? styles.msgOk : styles.msgErr}>
          {msg.texto}
        </div>
      )}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nombre, CI o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={styles.searchInput}
        />
        <span
          style={{
            fontSize: 13,
            color: "var(--color-text-muted)",
            whiteSpace: "nowrap",
          }}
        >
          {tutoresFiltrados.length} resultado
          {tutoresFiltrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tutor</th>
              <th>CI</th>
              <th>Teléfono</th>
              <th>Niños vinculados</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && !tutoresFiltrados.length && (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  No se encontraron tutores.
                </td>
              </tr>
            )}
            {tutoresFiltrados.map((t) => {
              const ninos = ninosPorTutor[t.id_tutor] ?? [];
              return (
                <tr key={t.id_tutor}>
                  <td>
                    <div className={styles.tutorCell}>
                      <div className={styles.avatar}>
                        {t.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.tutorNombre}>{t.nombre}</div>
                        <div className={styles.tutorEmail}>{t.email ?? ""}</div>
                      </div>
                    </div>
                  </td>
                  <td>{t.ci}</td>
                  <td>{t.telefono ?? "—"}</td>

                  {/* Columna niños con badges */}
                  <td>
                    <div className={styles.ninosBadges}>
                      {ninos.length === 0 && (
                        <span className={styles.sinNinos}>Sin niños</span>
                      )}
                      {ninos.map((n) => (
                        <span
                          key={n.id_nino ?? n.id_nino}
                          className={styles.ninoBadge}
                        >
                          <span className={styles.ninoBadgeAvatar}>
                            {(n.nino_nombre ?? n.nombre ?? "?").charAt(0)}
                          </span>
                          {n.nino_nombre ?? n.nombre}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        padding: "3px 8px",
                        borderRadius: 10,
                        background: t.activo ? "#EAF3DE" : "#F1EFE8",
                        color: t.activo ? "#3B6D11" : "#5F5E5A",
                      }}
                    >
                      {t.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.btnIcon}
                        onClick={() => abrirDetalle(t)}
                      >
                        Ver
                      </button>
                      <button
                        className={styles.btnIcon}
                        onClick={() => abrirEditar(t)}
                      >
                        Editar
                      </button>
                      <button
                        className={styles.btnDanger}
                        onClick={() => handleEliminar(t.id_tutor)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer detalle mejorado */}
      {detalle && (
        <div className={styles.overlay} onClick={cerrarDetalle}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>Detalle del tutor</span>
              <button className={styles.btnClose} onClick={cerrarDetalle}>
                ✕
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Perfil */}
              <div className={styles.perfil}>
                <div className={styles.perfilAvatar}>
                  {detalle.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className={styles.perfilNombre}>{detalle.nombre}</div>
                  <div className={styles.perfilMeta}>CI: {detalle.ci}</div>
                  <div className={styles.perfilMeta}>
                    {ninosDetalle.length > 0
                      ? `${ninosDetalle.length} niño${ninosDetalle.length > 1 ? "s" : ""} vinculado${ninosDetalle.length > 1 ? "s" : ""}`
                      : "Sin niños vinculados"}
                  </div>
                </div>
              </div>

              {/* Info de contacto */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  Información de contacto
                </div>
                <div className={styles.infoList}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Teléfono</span>
                    <span className={styles.infoValue}>
                      {detalle.telefono ?? "—"}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Email</span>
                    <span className={styles.infoValue}>
                      {detalle.email ?? "—"}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Dirección</span>
                    <span className={styles.infoValue}>
                      {detalle.direccion ?? "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Niños con detalle completo */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  Niños vinculados ({ninosDetalle.length})
                </div>

                {loadDet && (
                  <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                    Cargando...
                  </p>
                )}

                {!loadDet &&
                  ninosDetalle.map((n) => (
                    <div key={n.id_nino} className={styles.ninoCardDetalle}>
                      <div className={styles.ninoCardAvatar}>
                        {n.foto ? (
                          <img src={n.foto} alt={n.nino_nombre ?? n.nombre} />
                        ) : (
                          (n.nino_nombre ?? n.nombre ?? "?").charAt(0)
                        )}
                      </div>
                      <div className={styles.ninoCardInfo}>
                        <span className={styles.ninoCardNombre}>
                          {n.nino_nombre ?? n.nombre}
                        </span>
                        <span className={styles.ninoCardMeta}>
                          {n.relacion
                            ? `Relación: ${n.relacion}`
                            : "Sin relación definida"}
                        </span>
                      </div>
                      {n.nino_edad !== undefined && (
                        <span className={styles.ninoCardEdad}>
                          {n.nino_edad} años
                        </span>
                      )}
                    </div>
                  ))}

                {!loadDet && !ninosDetalle.length && (
                  <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                    Este tutor no tiene niños vinculados.
                  </p>
                )}
              </div>

              {/* Acciones */}
              <div className={styles.drawerActions}>
                <button
                  className={styles.btnSecondary}
                  onClick={() => abrirEditar(detalle)}
                >
                  Editar tutor
                </button>
                <button
                  className={styles.btnDanger}
                  onClick={() => handleEliminar(detalle.id_tutor)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div className={styles.modalOverlay} onClick={cerrarModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {editando ? "Editar tutor" : "Nuevo tutor"}
              </span>
              <button className={styles.btnClose} onClick={cerrarModal}>
                ✕
              </button>
            </div>
            <TutoresForm
              tutor={editando}
              onGuardado={handleGuardado}
              onCancelar={cerrarModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}
