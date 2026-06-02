import { useEffect, useState, useCallback } from "react";
import {
  getCamaras,
  crearCamara,
  editarCamara,
  eliminarCamara,
} from "../../api/camarasApi";
import { getSalas } from "../../api/salasApi";
import Swal from "sweetalert2";

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = {
  page:       { display: "flex", flexDirection: "column", gap: 24 },
  pageHeader: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  pageTitle:  { fontSize: 22, fontWeight: 600, color: "var(--color-text)" },

  tabs: {
    display: "flex", gap: 4,
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    padding: 4, alignSelf: "flex-start",
  },
  tab: (activo) => ({
    padding: "7px 18px", fontSize: 14, fontWeight: 500,
    border: "none", borderRadius: "var(--radius-sm)",
    background: activo ? "var(--color-surface)" : "none",
    color: activo ? "var(--color-text)" : "var(--color-text-muted)",
    cursor: "pointer",
    boxShadow: activo ? "0 1px 4px rgba(0,0,0,.08)" : "none",
    transition: "all .15s",
  }),

  filters: {
    display: "flex", gap: 12, alignItems: "center",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)", padding: "14px 16px",
  },
  searchInput: {
    flex: 1, padding: "8px 12px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)", fontSize: 14,
    outline: "none", background: "var(--color-bg)",
    color: "var(--color-text)", fontFamily: "inherit",
  },
  select: {
    padding: "8px 12px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)", fontSize: 14,
    background: "var(--color-bg)", color: "var(--color-text)",
    outline: "none", fontFamily: "inherit",
  },

  // Grid de cámaras
  camarasGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: 20,
  },
  camaraCard: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
    display: "flex", flexDirection: "column",
  },
  streamBox: {
    position: "relative",
    background: "#0f172a",
    aspectRatio: "16/9",
  },
  streamFrame: {
    width: "100%", height: "100%",
    border: "none", display: "block",
  },
  streamPlaceholder: {
    width: "100%", height: "100%",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: 8, color: "#94a3b8", fontSize: 13,
  },
  camaraInfo: {
    padding: "14px 16px",
    display: "flex", flexDirection: "column", gap: 8,
  },
  camaraHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  camaraNombre: { fontSize: 14, fontWeight: 600, color: "var(--color-text)" },
  salaBadge: {
    fontSize: 11, fontWeight: 500,
    padding: "3px 10px", borderRadius: 10,
    background: "#E1F5EE", color: "#0F6E56",
  },
  camaraUrl: {
    fontSize: 12, color: "var(--color-text-muted)",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  camaraActions: { display: "flex", gap: 8 },

  // Tabla
  tableWrap: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)", overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    background: "var(--color-bg)", padding: "11px 16px", textAlign: "left",
    fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)",
    textTransform: "uppercase", letterSpacing: ".04em",
    borderBottom: "1px solid var(--color-border)",
  },
  td: {
    padding: "12px 16px", fontSize: 14, color: "var(--color-text)",
    borderBottom: "1px solid var(--color-border)", verticalAlign: "middle",
  },
  empty: {
    padding: 40, textAlign: "center",
    color: "var(--color-text-muted)", fontSize: 14,
  },
  actions: { display: "flex", gap: 8 },

  // Botones
  btnPrimary: {
    padding: "9px 18px", background: "var(--color-primary)",
    color: "#fff", border: "none", borderRadius: "var(--radius-sm)",
    fontSize: 14, fontWeight: 500, cursor: "pointer",
  },
  btnSecondary: {
    padding: "8px 14px", background: "none",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)", fontSize: 13,
    color: "var(--color-text-muted)", cursor: "pointer",
  },
  btnIcon: {
    padding: "5px 10px", fontSize: 13,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)", background: "none",
    cursor: "pointer", color: "var(--color-text-muted)",
  },
  btnDanger: {
    padding: "5px 10px", fontSize: 13,
    border: "1px solid #F09595", borderRadius: "var(--radius-sm)",
    background: "none", cursor: "pointer", color: "var(--color-danger)",
  },

  // Modal
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
    zIndex: 200, display: "flex", alignItems: "center",
    justifyContent: "center", padding: 24,
  },
  modal: {
    background: "var(--color-surface)", borderRadius: "var(--radius-lg)",
    width: "100%", maxWidth: 500,
    boxShadow: "0 8px 32px rgba(0,0,0,.18)",
    display: "flex", flexDirection: "column",
  },
  modalHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 24px", borderBottom: "1px solid var(--color-border)",
  },
  modalTitle:  { fontSize: 17, fontWeight: 600 },
  btnClose: {
    padding: "4px 8px", fontSize: 18, background: "none",
    border: "none", cursor: "pointer", color: "var(--color-text-muted)",
  },
  modalBody:   { padding: 24, display: "flex", flexDirection: "column", gap: 16 },
  modalFooter: {
    padding: "16px 24px", borderTop: "1px solid var(--color-border)",
    display: "flex", gap: 10, justifyContent: "flex-end",
  },
  formField: { display: "flex", flexDirection: "column", gap: 6 },
  label:     { fontSize: 13, fontWeight: 500, color: "var(--color-text)" },
  input: {
    padding: "9px 12px", border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)", fontSize: 14,
    color: "var(--color-text)", background: "var(--color-bg)",
    outline: "none", fontFamily: "inherit",
  },
  select2: {
    padding: "9px 12px", border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)", fontSize: 14,
    color: "var(--color-text)", background: "var(--color-bg)",
    outline: "none", fontFamily: "inherit", width: "100%",
  },

  msgOk: {
    padding: "10px 14px", background: "#EAF3DE",
    border: "1px solid #97C459", borderRadius: "var(--radius-sm)",
    fontSize: 13, color: "#3B6D11",
  },
  msgErr: {
    padding: "10px 14px", background: "#FCEBEB",
    border: "1px solid #F09595", borderRadius: "var(--radius-sm)",
    fontSize: 13, color: "#A32D2D",
  },

  activoBadge: (activo) => ({
    fontSize: 12, fontWeight: 500,
    padding: "3px 8px", borderRadius: 10,
    background: activo ? "#EAF3DE" : "#F1EFE8",
    color:      activo ? "#3B6D11" : "#5F5E5A",
  }),
};

const FORM_INICIAL = { id_sala: "", url_stream: "" };

// ── Componente ────────────────────────────────────────────────────────────────
export default function CamarasPage() {
  const [tab,      setTab]      = useState("ver");
  const [camaras,  setCamaras]  = useState([]);
  const [salas,    setSalas]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroSala, setFiltroSala] = useState("");
  const [msg,      setMsg]      = useState(null);

  // Stream activo en vista "ver"
  const [camaraActiva, setCamaraActiva] = useState(null);

  // Modal
  const [modal,     setModal]     = useState(false);
  const [editando,  setEditando]  = useState(null);
  const [form,      setForm]      = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [modalMsg,  setModalMsg]  = useState(null);

  const mostrarMsg = (tipo, texto) => {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg(null), 3500);
  };

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([getCamaras(), getSalas()]);
      const lista = c.data.results ?? c.data;
      setCamaras(lista);
      setSalas(s.data.results ?? s.data);
      if (lista.length && !camaraActiva) setCamaraActiva(lista[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const camarasFiltradas = camaras.filter((c) => {
    const matchBusq = c.sala_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
                      c.url_stream?.toLowerCase().includes(busqueda.toLowerCase());
    const matchSala = filtroSala ? String(c.id_sala) === filtroSala : true;
    return matchBusq && matchSala;
  });

  // ── Modal ──────────────────────────────────────────────────────
  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setModalMsg(null);
    setModal(true);
  };

  const abrirEditar = (c) => {
    setEditando(c);
    setForm({ id_sala: c.id_sala, url_stream: c.url_stream });
    setModalMsg(null);
    setModal(true);
  };

  const cerrarModal = () => {
    setModal(false);
    setEditando(null);
    setModalMsg(null);
  };

  const handleGuardar = async () => {
    if (!form.id_sala || !form.url_stream.trim()) {
      setModalMsg({ tipo: "err", texto: "Sala y URL del stream son obligatorios." });
      return;
    }
    setGuardando(true);
    setModalMsg(null);
    try {
      if (editando) {
        await editarCamara(editando.id_camara, form);
        mostrarMsg("ok", "Cámara actualizada.");
      } else {
        await crearCamara(form);
        mostrarMsg("ok", "Cámara registrada.");
      }
      await cargarDatos();
      cerrarModal();
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data ?? {})[0]?.[0] ||
        "Error al guardar.";
      setModalMsg({ tipo: "err", texto: detail });
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (camara) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar cámara?",
      text: `Sala: ${camara.sala_nombre}`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });
    if (!confirm.isConfirmed) return;
    try {
      await eliminarCamara(camara.id_camara);
      mostrarMsg("ok", "Cámara eliminada.");
      if (camaraActiva?.id_camara === camara.id_camara) setCamaraActiva(null);
      await cargarDatos();
    } catch {
      mostrarMsg("err", "No se pudo eliminar la cámara.");
    }
  };

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>Cámaras</h1>
        <button style={s.btnPrimary} onClick={abrirCrear}>
          + Nueva cámara
        </button>
      </div>

      {msg && (
        <div style={msg.tipo === "ok" ? s.msgOk : s.msgErr}>{msg.texto}</div>
      )}

      {/* Tabs */}
      <div style={s.tabs}>
        {[
          { key: "ver",    label: "Ver streams" },
          { key: "lista",  label: "Gestionar" },
        ].map((t) => (
          <button
            key={t.key}
            style={s.tab(tab === t.key)}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB VER STREAMS ── */}
      {tab === "ver" && (
        <>
          {loading ? (
            <div style={s.empty}>Cargando cámaras...</div>
          ) : !camaras.filter((c) => c.activo).length ? (
            <div style={s.empty}>No hay cámaras registradas.</div>
          ) : (
            <>
              {/* Selector de cámara activa */}
              {camaras.filter((c) => c.activo).length > 1 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {camaras.filter((c) => c.activo).map((c) => (
                    <button
                      key={c.id_camara}
                      onClick={() => setCamaraActiva(c)}
                      style={{
                        padding: "7px 16px",
                        border: `1px solid ${camaraActiva?.id_camara === c.id_camara ? "var(--color-primary)" : "var(--color-border)"}`,
                        borderRadius: "var(--radius-sm)",
                        background: camaraActiva?.id_camara === c.id_camara ? "#E1F5EE" : "none",
                        color: camaraActiva?.id_camara === c.id_camara ? "var(--color-primary-dk)" : "var(--color-text-muted)",
                        fontSize: 13, fontWeight: 500, cursor: "pointer",
                      }}
                    >
                      📷 {c.sala_nombre}
                    </button>
                  ))}
                </div>
              )}

              {/* Stream principal */}
              {camaraActiva && (
                <div style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                }}>
                  <div style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: "#E24B4A",
                        boxShadow: "0 0 6px #E24B4A",
                        display: "inline-block",
                        animation: "pulse 1.5s infinite",
                      }} />
                      <span style={{ fontWeight: 600, fontSize: 15 }}>
                        {camaraActiva.sala_nombre}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      EN VIVO
                    </span>
                  </div>

                  <div style={{ position: "relative", background: "#0f172a", aspectRatio: "16/9" }}>
                    <iframe
                      src={camaraActiva.url_stream}
                      title={`Cámara — ${camaraActiva.sala_nombre}`}
                      style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                      allowFullScreen
                    />
                  </div>

                  <div style={{ padding: "12px 20px" }}>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      URL: {camaraActiva.url_stream}
                    </p>
                  </div>
                </div>
              )}

              {/* Grid de todas las cámaras */}
              {camaras.filter((c) => c.activo).length > 1 && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
                    Todas las salas
                  </div>
                  <div style={s.camarasGrid}>
                    {camaras.filter((c) => c.activo).map((c) => (
                      <div
                        key={c.id_camara}
                        style={{
                          ...s.camaraCard,
                          cursor: "pointer",
                          border: `1px solid ${camaraActiva?.id_camara === c.id_camara ? "var(--color-primary)" : "var(--color-border)"}`,
                        }}
                        onClick={() => setCamaraActiva(c)}
                      >
                        <div style={{ ...s.streamBox, aspectRatio: "16/9" }}>
                          <iframe
                            src={c.url_stream}
                            title={`Mini — ${c.sala_nombre}`}
                            style={s.streamFrame}
                            allowFullScreen
                          />
                        </div>
                        <div style={s.camaraInfo}>
                          <div style={s.camaraHeader}>
                            <span style={s.camaraNombre}>{c.sala_nombre}</span>
                            <span style={s.salaBadge}>▦ Sala</span>
                          </div>
                          <span style={s.camaraUrl}>{c.url_stream}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ── TAB GESTIONAR ── */}
      {tab === "lista" && (
        <>
          <div style={s.filters}>
            <input
              type="text"
              placeholder="Buscar por sala o URL..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={s.searchInput}
            />
            <select
              value={filtroSala}
              onChange={(e) => setFiltroSala(e.target.value)}
              style={s.select}
            >
              <option value="">Todas las salas</option>
              {salas.map((s) => (
                <option key={s.id_sala} value={String(s.id_sala)}>
                  {s.nombre}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
              {camarasFiltradas.length} cámara{camarasFiltradas.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Sala</th>
                  <th style={s.th}>URL del stream</th>
                  <th style={s.th}>Estado</th>
                  <th style={s.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={4} style={s.empty}>Cargando...</td></tr>
                )}
                {!loading && !camarasFiltradas.length && (
                  <tr>
                    <td colSpan={4} style={s.empty}>No hay cámaras registradas.</td>
                  </tr>
                )}
                {camarasFiltradas.map((c, i) => (
                  <tr key={c.id_camara} style={{
                    background: i % 2 === 0 ? "var(--color-surface)" : "var(--color-bg)",
                  }}>
                    <td style={s.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16 }}>📷</span>
                        <span style={{ fontWeight: 500 }}>{c.sala_nombre}</span>
                      </div>
                    </td>
                    <td style={s.td}>
                      <span style={{
                        fontSize: 12, color: "var(--color-text-muted)",
                        maxWidth: 300, overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap",
                        display: "block",
                      }}>
                        {c.url_stream}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={s.activoBadge(c.activo)}>
                        {c.activo ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button
                          style={s.btnIcon}
                          onClick={() => {
                            setCamaraActiva(c);
                            setTab("ver");
                          }}
                        >
                          Ver
                        </button>
                        <button
                          style={s.btnIcon}
                          onClick={() => abrirEditar(c)}
                        >
                          Editar
                        </button>
                        <button
                          style={s.btnDanger}
                          onClick={() => handleEliminar(c)}
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
        </>
      )}

      {/* ── MODAL CREAR / EDITAR ── */}
      {modal && (
        <div style={s.overlay} onClick={cerrarModal}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>
                {editando ? "Editar cámara" : "Nueva cámara"}
              </span>
              <button style={s.btnClose} onClick={cerrarModal}>✕</button>
            </div>

            <div style={s.modalBody}>
              {modalMsg && (
                <div style={modalMsg.tipo === "ok" ? s.msgOk : s.msgErr}>
                  {modalMsg.texto}
                </div>
              )}

              <div style={s.formField}>
                <label style={s.label}>Sala *</label>
                <select
                  value={form.id_sala}
                  onChange={(e) => setForm((p) => ({ ...p, id_sala: e.target.value }))}
                  style={s.select2}
                >
                  <option value="">— Seleccioná una sala —</option>
                  {salas.map((sala) => (
                    <option key={sala.id_sala} value={sala.id_sala}>
                      {sala.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div style={s.formField}>
                <label style={s.label}>URL del stream *</label>
                <input
                  type="url"
                  value={form.url_stream}
                  onChange={(e) => setForm((p) => ({ ...p, url_stream: e.target.value }))}
                  style={s.input}
                  placeholder="https://ejemplo.com/stream o http://192.168.1.x/video"
                />
                <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                  Ingresá la URL pública del stream. Debe ser accesible desde el navegador (HTTP/HTTPS).
                </span>
              </div>

              {/* Preview del stream */}
              {form.url_stream && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={s.label}>Preview</label>
                  <div style={{
                    background: "#0f172a", borderRadius: "var(--radius-sm)",
                    aspectRatio: "16/9", overflow: "hidden",
                  }}>
                    <iframe
                      src={form.url_stream}
                      title="Preview"
                      style={{ width: "100%", height: "100%", border: "none" }}
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={s.modalFooter}>
              <button style={s.btnSecondary} onClick={cerrarModal}>
                Cancelar
              </button>
              <button
                style={{ ...s.btnPrimary, opacity: guardando ? 0.6 : 1 }}
                onClick={handleGuardar}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Registrar cámara"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}