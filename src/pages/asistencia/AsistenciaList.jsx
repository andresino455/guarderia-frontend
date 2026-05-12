import { useEffect, useState, useCallback } from "react";
import {
  getAsistencias,
  crearAsistencia,
  editarAsistencia,
  eliminarAsistencia,
  getAsistenciaHoy,
  checkinNino,
  checkoutNino,
  getReporte,
  getNinos,
} from "../../api/asistenciaApi";
import styles from "./Asistencia.module.css";

const FORM_INICIAL = {
  id_nino: "",
  fecha: new Date().toISOString().split("T")[0],
  hora_ingreso: "",
  hora_salida: "",
  estado: "presente",
};

function estadoClass(estado) {
  const map = {
    presente: styles.presente,
    ausente: styles.ausente,
    tardanza: styles.tardanza,
  };
  return map[estado] ?? styles.presente;
}

export default function AsistenciaList() {
  const [tab, setTab] = useState("hoy");
  const [asistencias, setAsistencias] = useState([]);
  const [hoy, setHoy] = useState(null);
  const [ninos, setNinos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [msg, setMsg] = useState(null);

  // Check-in panel
  const [ninoCheckin, setNinoCheckin] = useState("");
  const [estadoCheckin, setEstadoCheckin] = useState("presente");
  const [haciendoCheckin, setHaciendoCheckin] = useState(false);

  // Modal crear/editar
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [modalMsg, setModalMsg] = useState(null);

  // Reporte
  const [reporte, setReporte] = useState(null);
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const [cargandoReporte, setCargandoReporte] = useState(false);

  const mostrarMsg = (tipo, texto) => {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg(null), 3500);
  };

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [a, h, n] = await Promise.all([
        getAsistencias(),
        getAsistenciaHoy(),
        getNinos(),
      ]);
      setAsistencias(a.data.results ?? a.data);
      setHoy(h.data);
      setNinos(n.data.results ?? n.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const asistenciasFiltradas = asistencias.filter((a) => {
    const matchBusq = a.nino_nombre
      ?.toLowerCase()
      .includes(busqueda.toLowerCase());
    const matchEstado = filtroEstado ? a.estado === filtroEstado : true;
    const matchFecha = filtroFecha ? a.fecha === filtroFecha : true;
    return matchBusq && matchEstado && matchFecha;
  });

  // ── Check-in ──────────────────────────────────────────────────
  const handleCheckin = async () => {
    if (!ninoCheckin) return;
    setHaciendoCheckin(true);
    try {
      await checkinNino({ id_nino: ninoCheckin, estado: estadoCheckin });
      mostrarMsg("ok", "Entrada registrada correctamente.");
      setNinoCheckin("");
      cargarDatos();
    } catch (err) {
      mostrarMsg(
        "err",
        err.response?.data?.detail ?? "Error al registrar entrada.",
      );
    } finally {
      setHaciendoCheckin(false);
    }
  };

  const handleCheckout = async (id_asistencia) => {
    const hora = new Date().toTimeString().slice(0, 8);
    try {
      await checkoutNino(id_asistencia, { hora_salida: hora });
      mostrarMsg("ok", "Salida registrada.");
      cargarDatos();
    } catch (err) {
      mostrarMsg(
        "err",
        err.response?.data?.detail ?? "Error al registrar salida.",
      );
    }
  };

  // ── CRUD ─────────────────────────────────────────────────────
  const abrirCrear = () => {
    setEditando(null);
    setForm({ ...FORM_INICIAL, fecha: new Date().toISOString().split("T")[0] });
    setModalMsg(null);
    setModal(true);
  };

  const abrirEditar = (a) => {
    setEditando(a);
    setForm({
      id_nino: a.id_nino,
      fecha: a.fecha,
      hora_ingreso: a.hora_ingreso ?? "",
      hora_salida: a.hora_salida ?? "",
      estado: a.estado,
    });
    setModalMsg(null);
    setModal(true);
  };

  const cerrarModal = () => {
    setModal(false);
    setEditando(null);
    setModalMsg(null);
  };

  const handleGuardar = async () => {
    if (!form.id_nino || !form.fecha || !form.estado) {
      setModalMsg({
        tipo: "err",
        texto: "Niño, fecha y estado son obligatorios.",
      });
      return;
    }
    setGuardando(true);
    setModalMsg(null);
    try {
      const payload = {
        id_nino: form.id_nino,
        fecha: form.fecha,
        estado: form.estado,
        hora_ingreso: form.hora_ingreso || null,
        hora_salida: form.hora_salida || null,
      };
      if (editando) {
        await editarAsistencia(editando.id_asistencia, payload);
        mostrarMsg("ok", "Asistencia actualizada.");
      } else {
        await crearAsistencia(payload);
        mostrarMsg("ok", "Asistencia registrada.");
      }
      cargarDatos();
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

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      await eliminarAsistencia(id);
      mostrarMsg("ok", "Registro eliminado.");
      cargarDatos();
    } catch {
      mostrarMsg("err", "No se pudo eliminar.");
    }
  };

  // ── Reporte ───────────────────────────────────────────────────
  const handleReporte = async () => {
    setCargandoReporte(true);
    try {
      const { data } = await getReporte({
        desde: filtroDesde || undefined,
        hasta: filtroHasta || undefined,
      });
      setReporte(data);
    } catch {
      mostrarMsg("err", "Error al generar el reporte.");
    } finally {
      setCargandoReporte(false);
    }
  };

  const fechaHoy = new Date().toLocaleDateString("es-BO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Asistencia</h1>
        {tab === "historial" && (
          <button className={styles.btnPrimary} onClick={abrirCrear}>
            + Registrar manual
          </button>
        )}
      </div>

      {msg && (
        <div className={msg.tipo === "ok" ? styles.msgOk : styles.msgErr}>
          {msg.texto}
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { key: "hoy", label: "Hoy" },
          { key: "historial", label: "Historial" },
          { key: "reporte", label: "Reporte" },
        ].map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.active : ""}`}
            onClick={() => {
              setTab(t.key);
              setBusqueda("");
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB HOY ── */}
      {tab === "hoy" && (
        <>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-muted)",
              marginTop: -8,
            }}
          >
            {fechaHoy}
          </p>

          {/* Resumen */}
          <div className={styles.resumenGrid}>
            <div className={`${styles.resumenCard} ${styles.green}`}>
              <div className={styles.resumenIcon}>◉</div>
              <div>
                <div className={styles.resumenValue}>
                  {hoy?.total_presentes ?? 0}
                </div>
                <div className={styles.resumenLabel}>Presentes</div>
              </div>
            </div>
            <div className={`${styles.resumenCard} ${styles.red}`}>
              <div className={styles.resumenIcon}>◎</div>
              <div>
                <div className={styles.resumenValue}>
                  {hoy?.total_ausentes ?? 0}
                </div>
                <div className={styles.resumenLabel}>Ausentes</div>
              </div>
            </div>
            <div className={`${styles.resumenCard} ${styles.amber}`}>
              <div className={styles.resumenIcon}>◷</div>
              <div>
                <div className={styles.resumenValue}>
                  {hoy?.total_tardanzas ?? 0}
                </div>
                <div className={styles.resumenLabel}>Tardanzas</div>
              </div>
            </div>
            <div className={`${styles.resumenCard} ${styles.blue}`}>
              <div className={styles.resumenIcon}>◈</div>
              <div>
                <div className={styles.resumenValue}>
                  {hoy?.sin_registro?.length ?? 0}
                </div>
                <div className={styles.resumenLabel}>Sin registro</div>
              </div>
            </div>
          </div>

          {/* Check-in rápido */}
          <div className={styles.checkinPanel}>
            <span className={styles.checkinTitle}>Check-in rápido</span>
            <div className={styles.checkinForm}>
              <select
                value={ninoCheckin}
                onChange={(e) => setNinoCheckin(e.target.value)}
                className={styles.checkinSelect}
              >
                <option value="">— Seleccioná un niño —</option>
                {(hoy?.sin_registro ?? []).map((n) => (
                  <option key={n.id_nino} value={n.id_nino}>
                    {n.nombre}
                  </option>
                ))}
              </select>
              <select
                value={estadoCheckin}
                onChange={(e) => setEstadoCheckin(e.target.value)}
                className={styles.estadoSelect}
              >
                <option value="presente">Presente</option>
                <option value="tardanza">Tardanza</option>
                <option value="ausente">Ausente</option>
              </select>
              <button
                className={styles.btnPrimary}
                onClick={handleCheckin}
                disabled={haciendoCheckin || !ninoCheckin}
              >
                {haciendoCheckin ? "Registrando..." : "Registrar entrada"}
              </button>
            </div>
          </div>

          {/* Registros del día */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Niño</th>
                  <th>Estado</th>
                  <th>Hora ingreso</th>
                  <th>Hora salida</th>
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
                {!loading && !hoy?.registros?.length && (
                  <tr>
                    <td colSpan={5} className={styles.empty}>
                      Sin registros de asistencia hoy.
                    </td>
                  </tr>
                )}
                {(hoy?.registros ?? []).map((a) => (
                  <tr key={a.id_asistencia}>
                    <td style={{ fontWeight: 500 }}>{a.nino_nombre}</td>
                    <td>
                      <span
                        className={`${styles.estadoBadge} ${estadoClass(a.estado)}`}
                      >
                        {a.estado.charAt(0).toUpperCase() + a.estado.slice(1)}
                      </span>
                    </td>
                    <td>{a.hora_ingreso ?? "—"}</td>
                    <td>{a.hora_salida ?? "—"}</td>
                    <td>
                      <div className={styles.actions}>
                        {!a.hora_salida && a.estado === "presente" && (
                          <button
                            className={styles.btnSuccess}
                            onClick={() => handleCheckout(a.id_asistencia)}
                          >
                            Registrar salida
                          </button>
                        )}
                        <button
                          className={styles.btnIcon}
                          onClick={() => abrirEditar(a)}
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Niños sin registro */}
          {(hoy?.sin_registro?.length ?? 0) > 0 && (
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  marginBottom: 8,
                }}
              >
                Sin registro hoy ({hoy.sin_registro.length})
              </p>
              <div className={styles.sinRegistroList}>
                {hoy.sin_registro.map((n) => (
                  <div key={n.id_nino} className={styles.sinRegistroItem}>
                    <span className={styles.sinRegistroNombre}>{n.nombre}</span>
                    <button
                      className={styles.btnPrimary}
                      style={{ padding: "6px 14px", fontSize: 13 }}
                      onClick={() => {
                        setNinoCheckin(String(n.id_nino));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Registrar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TAB HISTORIAL ── */}
      {tab === "historial" && (
        <>
          <div className={styles.filters}>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={styles.searchInput}
            />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className={styles.select}
            >
              <option value="">Todos los estados</option>
              <option value="presente">Presente</option>
              <option value="ausente">Ausente</option>
              <option value="tardanza">Tardanza</option>
            </select>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className={styles.select}
            />
            {filtroFecha && (
              <button
                className={styles.btnSecondary}
                onClick={() => setFiltroFecha("")}
                style={{ padding: "8px 10px", fontSize: 13 }}
              >
                ✕
              </button>
            )}
            <span
              style={{
                fontSize: 13,
                color: "var(--color-text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              {asistenciasFiltradas.length} registro
              {asistenciasFiltradas.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Niño</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Ingreso</th>
                  <th>Salida</th>
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
                {!loading && !asistenciasFiltradas.length && (
                  <tr>
                    <td colSpan={6} className={styles.empty}>
                      No se encontraron registros.
                    </td>
                  </tr>
                )}
                {asistenciasFiltradas.map((a) => (
                  <tr key={a.id_asistencia}>
                    <td style={{ fontWeight: 500 }}>{a.nino_nombre}</td>
                    <td>{a.fecha}</td>
                    <td>
                      <span
                        className={`${styles.estadoBadge} ${estadoClass(a.estado)}`}
                      >
                        {a.estado.charAt(0).toUpperCase() + a.estado.slice(1)}
                      </span>
                    </td>
                    <td>{a.hora_ingreso ?? "—"}</td>
                    <td>{a.hora_salida ?? "—"}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.btnIcon}
                          onClick={() => abrirEditar(a)}
                        >
                          Editar
                        </button>
                        <button
                          className={styles.btnDanger}
                          onClick={() => handleEliminar(a.id_asistencia)}
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

      {/* ── TAB REPORTE ── */}
      {tab === "reporte" && (
        <>
          <div className={styles.filters}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                Desde
              </label>
              <input
                type="date"
                value={filtroDesde}
                onChange={(e) => setFiltroDesde(e.target.value)}
                className={styles.select}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                Hasta
              </label>
              <input
                type="date"
                value={filtroHasta}
                onChange={(e) => setFiltroHasta(e.target.value)}
                className={styles.select}
              />
            </div>
            <button
              className={styles.btnPrimary}
              onClick={handleReporte}
              disabled={cargandoReporte}
              style={{ alignSelf: "flex-end" }}
            >
              {cargandoReporte ? "Generando..." : "Generar reporte"}
            </button>
          </div>

          {reporte && (
            <div className={styles.reporteGrid}>
              <div className={styles.reporteCard}>
                <span className={styles.reporteCardTitle}>
                  Resumen por estado
                </span>
                {reporte.resumen.map((r) => (
                  <div key={r.estado} className={styles.reporteRow}>
                    <span className={styles.reporteLabel}>
                      <span
                        className={`${styles.estadoBadge} ${estadoClass(r.estado)}`}
                      >
                        {r.estado}
                      </span>
                    </span>
                    <span className={styles.reporteValue}>
                      {r.total} registros
                    </span>
                  </div>
                ))}
                {!reporte.resumen.length && (
                  <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                    Sin datos para el período.
                  </p>
                )}
              </div>

              <div className={styles.reporteCard}>
                <span className={styles.reporteCardTitle}>
                  Detalle ({reporte.detalle?.length ?? 0} registros)
                </span>
                <div
                  style={{
                    maxHeight: 300,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {(reporte.detalle ?? []).slice(0, 20).map((d) => (
                    <div key={d.id_asistencia} className={styles.reporteRow}>
                      <span className={styles.reporteLabel}>
                        {d.nino_nombre} — {d.fecha}
                      </span>
                      <span
                        className={`${styles.estadoBadge} ${estadoClass(d.estado)}`}
                      >
                        {d.estado}
                      </span>
                    </div>
                  ))}
                  {(reporte.detalle?.length ?? 0) > 20 && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--color-text-muted)",
                        textAlign: "center",
                      }}
                    >
                      Mostrando 20 de {reporte.detalle.length} registros.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!reporte && !cargandoReporte && (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                fontSize: 14,
                color: "var(--color-text-muted)",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
              }}
            >
              Seleccioná un rango de fechas y generá el reporte.
            </div>
          )}
        </>
      )}

      {/* ── MODAL CREAR / EDITAR ── */}
      {modal && (
        <div className={styles.overlay} onClick={cerrarModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {editando ? "Editar asistencia" : "Registrar asistencia"}
              </span>
              <button className={styles.btnClose} onClick={cerrarModal}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {modalMsg && (
                <div
                  className={
                    modalMsg.tipo === "ok" ? styles.msgOk : styles.msgErr
                  }
                >
                  {modalMsg.texto}
                </div>
              )}

              <div className={styles.formGrid}>
                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Niño *</label>
                  <select
                    value={form.id_nino}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, id_nino: e.target.value }))
                    }
                    className={styles.select2}
                  >
                    <option value="">— Seleccioná un niño —</option>
                    {ninos.map((n) => (
                      <option key={n.id_nino} value={n.id_nino}>
                        {n.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Fecha *</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, fecha: e.target.value }))
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Estado *</label>
                  <select
                    value={form.estado}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, estado: e.target.value }))
                    }
                    className={styles.select2}
                  >
                    <option value="presente">Presente</option>
                    <option value="tardanza">Tardanza</option>
                    <option value="ausente">Ausente</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Hora ingreso</label>
                  <input
                    type="time"
                    value={form.hora_ingreso}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, hora_ingreso: e.target.value }))
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Hora salida</label>
                  <input
                    type="time"
                    value={form.hora_salida}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, hora_salida: e.target.value }))
                    }
                    className={styles.input}
                  />
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
                    : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
