import { useEffect, useState, useCallback } from "react";
import {
  getPagos,
  crearPago,
  // editarPago,
  eliminarPago,
  marcarPagado,
  getResumenPagos,
  generarMensual,
  getNinos,
  getServicios,
} from "../../api/serviciosApi";
import Swal from "sweetalert2";
import styles from "./Pagos.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
function estadoClass(estado) {
  const map = {
    pagado: styles.estadoPagado,
    pendiente: styles.estadoPendiente,
    anulado: styles.estadoAnulado,
  };
  return map[estado] ?? styles.estadoPendiente;
}

function formatMonto(valor) {
  return `Bs. ${parseFloat(valor ?? 0).toFixed(2)}`;
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const HOY = new Date();

// ── Componente principal ──────────────────────────────────────────────────────
export default function PagosList() {
  const [tab, setTab] = useState("lista");

  // Datos
  const [pagos, setPagos] = useState([]);
  const [ninos, setNinos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // Filtros
  const [filtroNino, setFiltroNino] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  // Resumen mes
  const [mesSel, setMesSel] = useState(HOY.getMonth() + 1);
  const [anioSel, setAnioSel] = useState(HOY.getFullYear());

  // Modal crear pago
  const [modal, setModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [modalMsg, setModalMsg] = useState(null);
  const [formPago, setFormPago] = useState({
    id_nino: "",
    fecha: HOY.toISOString().split("T")[0],
    estado: "pendiente",
  });
  const [serviciosElegidos, setServiciosElegidos] = useState([]);

  // Generar mensual
  const [generando, setGenerando] = useState(false);
  const [mesMensual, setMesMensual] = useState(HOY.getMonth() + 1);
  const [anioMensual, setAnioMensual] = useState(HOY.getFullYear());

  const mostrarMsg = (tipo, texto) => {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg(null), 3500);
  };

  // ── Carga de datos ─────────────────────────────────────────────
  const cargarPagos = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroNino) params.nino = filtroNino;
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroDesde) params.desde = filtroDesde;
      if (filtroHasta) params.hasta = filtroHasta;
      const { data } = await getPagos(params);
      setPagos(data.results ?? data);
    } finally {
      setLoading(false);
    }
  }, [filtroNino, filtroEstado, filtroDesde, filtroHasta]);

  const cargarResumen = useCallback(async () => {
    try {
      const { data } = await getResumenPagos({ mes: mesSel, anio: anioSel });
      setResumen(data);
    } catch {
      setResumen(null);
    }
  }, [mesSel, anioSel]);

  useEffect(() => {
    Promise.all([getNinos(), getServicios()]).then(([n, s]) => {
      setNinos(n.data.results ?? n.data);
      setServicios(s.data.results ?? s.data);
    });
  }, []);

  useEffect(() => {
    cargarPagos();
  }, [cargarPagos]);
  useEffect(() => {
    if (tab === "resumen") cargarResumen();
  }, [tab, cargarResumen]);

  // ── Acciones ───────────────────────────────────────────────────
  const handleMarcarPagado = async (pago) => {
    const confirm = await Swal.fire({
      icon: "question",
      title: "¿Marcar como pagado?",
      text: `Pago de ${pago.nino_nombre} — ${formatMonto(pago.total)}`,
      showCancelButton: true,
      confirmButtonText: "Sí, marcar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#1D9E75",
      cancelButtonColor: "#64748b",
    });
    if (!confirm.isConfirmed) return;
    try {
      await marcarPagado(pago.id_pago);
      mostrarMsg("ok", "Pago marcado como pagado.");
      await cargarPagos();
    } catch (err) {
      mostrarMsg("err", err.response?.data?.detail ?? "Error al marcar pago.");
    }
  };

  const handleAnular = async (pago) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "¿Anular este pago?",
      text: `Pago de ${pago.nino_nombre} — ${formatMonto(pago.total)}`,
      showCancelButton: true,
      confirmButtonText: "Sí, anular",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#E24B4A",
      cancelButtonColor: "#64748b",
    });
    if (!confirm.isConfirmed) return;
    try {
      await eliminarPago(pago.id_pago);
      mostrarMsg("ok", "Pago anulado.");
      await cargarPagos();
    } catch (err) {
      mostrarMsg("err", err.response?.data?.detail ?? "Error al anular.");
    }
  };

  const handleGenerarMensual = async () => {
    const confirm = await Swal.fire({
      icon: "question",
      title: "¿Generar pagos mensuales?",
      html: `Se crearán pagos pendientes para <strong>${MESES[mesMensual - 1]} ${anioMensual}</strong> para todos los niños con servicios mensuales asignados.`,
      showCancelButton: true,
      confirmButtonText: "Sí, generar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#1D9E75",
      cancelButtonColor: "#64748b",
    });
    if (!confirm.isConfirmed) return;

    setGenerando(true);
    try {
      const { data } = await generarMensual({
        mes: mesMensual,
        anio: anioMensual,
      });
      await Swal.fire({
        icon: "success",
        title: "Pagos generados",
        text: data.detail,
        confirmButtonColor: "#1D9E75",
      });
      await cargarPagos();
    } catch (err) {
      mostrarMsg(
        "err",
        err.response?.data?.detail ?? "Error al generar pagos.",
      );
    } finally {
      setGenerando(false);
    }
  };

  // ── Modal crear pago ───────────────────────────────────────────
  const abrirModal = () => {
    setFormPago({
      id_nino: "",
      fecha: HOY.toISOString().split("T")[0],
      estado: "pendiente",
    });
    setServiciosElegidos([]);
    setModalMsg(null);
    setModal(true);
  };

  const toggleServicio = (servicio) => {
    setServiciosElegidos((prev) => {
      const existe = prev.find((s) => s.id_servicio === servicio.id_servicio);
      if (existe)
        return prev.filter((s) => s.id_servicio !== servicio.id_servicio);
      return [
        ...prev,
        { id_servicio: servicio.id_servicio, monto: servicio.precio },
      ];
    });
  };

  const totalElegido = serviciosElegidos.reduce(
    (acc, s) => acc + parseFloat(s.monto),
    0,
  );

  const handleGuardarPago = async () => {
    if (!formPago.id_nino) {
      setModalMsg({ tipo: "err", texto: "Seleccioná un niño." });
      return;
    }
    if (!serviciosElegidos.length) {
      setModalMsg({ tipo: "err", texto: "Seleccioná al menos un servicio." });
      return;
    }
    setGuardando(true);
    setModalMsg(null);
    try {
      await crearPago({
        id_nino: formPago.id_nino,
        fecha: formPago.fecha,
        estado: formPago.estado,
        detalles: serviciosElegidos,
      });
      mostrarMsg("ok", "Pago registrado correctamente.");
      setModal(false);
      await cargarPagos();
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

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Pagos</h1>
        {tab === "lista" && (
          <button className={styles.btnPrimary} onClick={abrirModal}>
            + Registrar pago
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
          { key: "lista", label: "Lista de pagos" },
          { key: "resumen", label: "Resumen del mes" },
          { key: "mensual", label: "Generar mensual" },
        ].map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.active : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB LISTA ── */}
      {tab === "lista" && (
        <>
          {/* Filtros */}
          <div className={styles.filters}>
            <select
              value={filtroNino}
              onChange={(e) => setFiltroNino(e.target.value)}
              className={styles.select}
            >
              <option value="">Todos los niños</option>
              {ninos.map((n) => (
                <option key={n.id_nino} value={n.id_nino}>
                  {n.nombre}
                </option>
              ))}
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className={styles.select}
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="anulado">Anulado</option>
            </select>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <label style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                Desde
              </label>
              <input
                type="date"
                value={filtroDesde}
                onChange={(e) => setFiltroDesde(e.target.value)}
                className={styles.select}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <label style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                Hasta
              </label>
              <input
                type="date"
                value={filtroHasta}
                onChange={(e) => setFiltroHasta(e.target.value)}
                className={styles.select}
              />
            </div>

            {(filtroNino || filtroEstado || filtroDesde || filtroHasta) && (
              <button
                className={styles.btnSecondary}
                onClick={() => {
                  setFiltroNino("");
                  setFiltroEstado("");
                  setFiltroDesde("");
                  setFiltroHasta("");
                }}
              >
                ✕ Limpiar
              </button>
            )}

            <span
              style={{
                fontSize: 13,
                color: "var(--color-text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              {pagos.length} pago{pagos.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Tabla */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Niño</th>
                  <th>Fecha</th>
                  <th>Servicios</th>
                  <th>Total</th>
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
                {!loading && !pagos.length && (
                  <tr>
                    <td colSpan={6} className={styles.empty}>
                      No se encontraron pagos.
                    </td>
                  </tr>
                )}
                {pagos.map((p) => (
                  <tr key={p.id_pago}>
                    <td style={{ fontWeight: 500 }}>{p.nino_nombre}</td>
                    <td>{formatFecha(p.fecha)}</td>
                    <td style={{ color: "var(--color-text-muted)" }}>
                      {p.cantidad_items} servicio
                      {p.cantidad_items !== 1 ? "s" : ""}
                    </td>
                    <td
                      style={{
                        fontWeight: 700,
                        color: "var(--color-primary-dk)",
                      }}
                    >
                      {formatMonto(p.total)}
                    </td>
                    <td>
                      <span
                        className={`${styles.estadoBadge} ${estadoClass(p.estado)}`}
                      >
                        {p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {p.estado === "pendiente" && (
                          <button
                            className={styles.btnSuccess}
                            onClick={() => handleMarcarPagado(p)}
                          >
                            Marcar pagado
                          </button>
                        )}
                        {p.estado !== "anulado" && (
                          <button
                            className={styles.btnDanger}
                            onClick={() => handleAnular(p)}
                          >
                            Anular
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── TAB RESUMEN ── */}
      {tab === "resumen" && (
        <>
          {/* Selector mes/año */}
          <div className={styles.filters}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <label style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                Mes
              </label>
              <select
                value={mesSel}
                onChange={(e) => setMesSel(Number(e.target.value))}
                className={styles.select}
              >
                {MESES.map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <label style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                Año
              </label>
              <select
                value={anioSel}
                onChange={(e) => setAnioSel(Number(e.target.value))}
                className={styles.select}
              >
                {[2024, 2025, 2026, 2027].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <button
              className={styles.btnPrimary}
              onClick={cargarResumen}
              style={{ alignSelf: "flex-end" }}
            >
              Ver resumen
            </button>
          </div>

          {resumen && (
            <>
              {/* Cards resumen */}
              <div className={styles.resumenGrid}>
                <div className={`${styles.resumenCard} ${styles.green}`}>
                  <div className={styles.resumenIcon}>◎</div>
                  <div>
                    <div className={styles.resumenValue}>
                      {formatMonto(resumen.total_pagado)}
                    </div>
                    <div className={styles.resumenLabel}>Cobrado este mes</div>
                  </div>
                </div>
                <div className={`${styles.resumenCard} ${styles.amber}`}>
                  <div className={styles.resumenIcon}>◷</div>
                  <div>
                    <div className={styles.resumenValue}>
                      {resumen.pendientes}
                    </div>
                    <div className={styles.resumenLabel}>Pagos pendientes</div>
                  </div>
                </div>
                <div className={`${styles.resumenCard} ${styles.blue}`}>
                  <div className={styles.resumenIcon}>✓</div>
                  <div>
                    <div className={styles.resumenValue}>
                      {resumen.total_pagos}
                    </div>
                    <div className={styles.resumenLabel}>Pagos completados</div>
                  </div>
                </div>
                <div className={`${styles.resumenCard} ${styles.red}`}>
                  <div className={styles.resumenIcon}>✕</div>
                  <div>
                    <div className={styles.resumenValue}>
                      {resumen.anulados}
                    </div>
                    <div className={styles.resumenLabel}>Pagos anulados</div>
                  </div>
                </div>
              </div>

              {/* Tabla del mes */}
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Niño</th>
                      <th>Fecha</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos
                      .filter((p) => {
                        const f = new Date(p.fecha);
                        return (
                          f.getMonth() + 1 === mesSel &&
                          f.getFullYear() === anioSel
                        );
                      })
                      .map((p) => (
                        <tr key={p.id_pago}>
                          <td style={{ fontWeight: 500 }}>{p.nino_nombre}</td>
                          <td>{formatFecha(p.fecha)}</td>
                          <td
                            style={{
                              fontWeight: 700,
                              color: "var(--color-primary-dk)",
                            }}
                          >
                            {formatMonto(p.total)}
                          </td>
                          <td>
                            <span
                              className={`${styles.estadoBadge} ${estadoClass(p.estado)}`}
                            >
                              {p.estado.charAt(0).toUpperCase() +
                                p.estado.slice(1)}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actions}>
                              {p.estado === "pendiente" && (
                                <button
                                  className={styles.btnSuccess}
                                  onClick={() => handleMarcarPagado(p)}
                                >
                                  Marcar pagado
                                </button>
                              )}
                              {p.estado !== "anulado" && (
                                <button
                                  className={styles.btnDanger}
                                  onClick={() => handleAnular(p)}
                                >
                                  Anular
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ── TAB GENERAR MENSUAL ── */}
      {tab === "mensual" && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            maxWidth: 480,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              Generar cobros mensuales
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--color-text-muted)",
                lineHeight: 1.6,
              }}
            >
              Crea automáticamente los pagos pendientes del mes seleccionado
              para todos los niños con servicios mensuales asignados. Si ya
              existe un pago para ese mes, no se duplica.
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <label style={{ fontSize: 13, fontWeight: 500 }}>Mes</label>
              <select
                value={mesMensual}
                onChange={(e) => setMesMensual(Number(e.target.value))}
                className={styles.select}
              >
                {MESES.map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <label style={{ fontSize: 13, fontWeight: 500 }}>Año</label>
              <select
                value={anioMensual}
                onChange={(e) => setAnioMensual(Number(e.target.value))}
                className={styles.select}
              >
                {[2024, 2025, 2026, 2027].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              padding: "12px 16px",
              background: "#E6F1FB",
              border: "1px solid #85B7EB",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
              color: "#185FA5",
            }}
          >
            ℹ️ Se generarán pagos para{" "}
            <strong>
              {MESES[mesMensual - 1]} {anioMensual}
            </strong>
          </div>

          <button
            className={styles.btnPrimary}
            onClick={handleGenerarMensual}
            disabled={generando}
            style={{ alignSelf: "flex-start" }}
          >
            {generando
              ? "Generando..."
              : `Generar pagos — ${MESES[mesMensual - 1]} ${anioMensual}`}
          </button>
        </div>
      )}

      {/* ── MODAL CREAR PAGO ── */}
      {modal && (
        <div className={styles.overlay} onClick={() => setModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Registrar pago manual</span>
              <button
                className={styles.btnClose}
                onClick={() => setModal(false)}
              >
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
                    value={formPago.id_nino}
                    onChange={(e) =>
                      setFormPago((p) => ({ ...p, id_nino: e.target.value }))
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
                    value={formPago.fecha}
                    onChange={(e) =>
                      setFormPago((p) => ({ ...p, fecha: e.target.value }))
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Estado</label>
                  <select
                    value={formPago.estado}
                    onChange={(e) =>
                      setFormPago((p) => ({ ...p, estado: e.target.value }))
                    }
                    className={styles.select2}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                  </select>
                </div>

                <div className={styles.sectionDivider}>Servicios incluidos</div>
              </div>

              {/* Selección de servicios */}
              <div className={styles.detallesList}>
                {servicios
                  .filter((s) => s.activo)
                  .map((s) => {
                    const elegido = serviciosElegidos.find(
                      (e) => e.id_servicio === s.id_servicio,
                    );
                    return (
                      <div
                        key={s.id_servicio}
                        className={styles.detalleItem}
                        style={{
                          cursor: "pointer",
                          borderColor: elegido
                            ? "var(--color-primary)"
                            : "var(--color-border)",
                          background: elegido ? "#E1F5EE" : "var(--color-bg)",
                        }}
                        onClick={() => toggleServicio(s)}
                      >
                        <input
                          type="checkbox"
                          readOnly
                          checked={!!elegido}
                          style={{ flexShrink: 0 }}
                        />
                        <span className={styles.detalleNombre}>{s.nombre}</span>
                        <span
                          className={`${styles.tipoBadge} ${styles.tipoMensual}`}
                        >
                          {s.tipo}
                        </span>
                        <span className={styles.detalleMonto}>
                          Bs. {parseFloat(s.precio).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* Total */}
              {serviciosElegidos.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    background: "var(--color-bg)",
                    borderRadius: "var(--radius-sm)",
                    borderTop: "2px solid var(--color-primary)",
                    marginTop: 4,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    Total ({serviciosElegidos.length} servicio
                    {serviciosElegidos.length !== 1 ? "s" : ""})
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: "var(--color-primary-dk)",
                    }}
                  >
                    Bs. {totalElegido.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.btnSecondary}
                onClick={() => setModal(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleGuardarPago}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Registrar pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
