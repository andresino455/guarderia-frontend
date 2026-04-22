import { useEffect, useState, useCallback } from "react";
import {
  getServicios,
  crearServicio,
  editarServicio,
  eliminarServicio,
  getPagos,
  crearPago,
  marcarPagado,
  eliminarPago,
  getResumenPagos,
  generarMensual,
  getNinos,
} from "../../api/serviciosApi";
import styles from "./Servicios.module.css";

const TIPOS = ["mensual", "eventual", "alimentacion", "transporte", "otro"];

const SERVICIO_INICIAL = {
  nombre: "",
  descripcion: "",
  precio: "",
  tipo: "mensual",
};

const PAGO_INICIAL = {
  id_nino: "",
  fecha: new Date().toISOString().split("T")[0],
  estado: "pendiente",
  detalles: [],
};

function tipoClass(tipo) {
  const map = {
    mensual: styles.tipoMensual,
    eventual: styles.tipoEventual,
    alimentacion: styles.tipoAlimentacion,
    transporte: styles.tipoTransporte,
    otro: styles.tipoOtro,
  };
  return map[tipo] ?? styles.tipoOtro;
}

function estadoClass(estado) {
  const map = {
    pagado: styles.estadoPagado,
    pendiente: styles.estadoPendiente,
    anulado: styles.estadoAnulado,
  };
  return map[estado] ?? styles.estadoPendiente;
}

export default function ServiciosList() {
  const [tab, setTab] = useState("servicios");
  const [servicios, setServicios] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [ninos, setNinos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [msg, setMsg] = useState(null);

  // Modal servicio
  const [modalServ, setModalServ] = useState(false);
  const [editandoServ, setEditandoServ] = useState(null);
  const [formServ, setFormServ] = useState(SERVICIO_INICIAL);
  const [guardandoServ, setGuardandoServ] = useState(false);
  const [modalMsgServ, setModalMsgServ] = useState(null);

  // Modal pago
  const [modalPago, setModalPago] = useState(false);
  const [formPago, setFormPago] = useState(PAGO_INICIAL);
  const [guardandoPago, setGuardandoPago] = useState(false);
  const [modalMsgPago, setModalMsgPago] = useState(null);
  const [serviciosElegidos, setServiciosElegidos] = useState([]);

  // Generar mensual
  const [generando, setGenerando] = useState(false);

  const mostrarMsg = (tipo, texto) => {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg(null), 3500);
  };

  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const anioActual = hoy.getFullYear();

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, n, r] = await Promise.all([
        getServicios(),
        getPagos(),
        getNinos(),
        getResumenPagos({ mes: mesActual, anio: anioActual }),
      ]);
      setServicios(s.data.results ?? s.data);
      setPagos(p.data.results ?? p.data);
      setNinos(n.data.results ?? n.data);
      setResumen(r.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Filtros
  const serviciosFiltrados = servicios.filter((s) => {
    const matchBusq = s.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo = filtroTipo ? s.tipo === filtroTipo : true;
    return matchBusq && matchTipo;
  });

  const pagosFiltrados = pagos.filter((p) => {
    const matchBusq = p.nino_nombre
      ?.toLowerCase()
      .includes(busqueda.toLowerCase());
    const matchEstado = filtroEstado ? p.estado === filtroEstado : true;
    return matchBusq && matchEstado;
  });

  // ── CRUD Servicios ────────────────────────────────────────────
  const abrirCrearServ = () => {
    setEditandoServ(null);
    setFormServ(SERVICIO_INICIAL);
    setModalMsgServ(null);
    setModalServ(true);
  };

  const abrirEditarServ = (s) => {
    setEditandoServ(s);
    setFormServ({
      nombre: s.nombre,
      descripcion: s.descripcion ?? "",
      precio: s.precio,
      tipo: s.tipo,
    });
    setModalMsgServ(null);
    setModalServ(true);
  };

  const cerrarModalServ = () => {
    setModalServ(false);
    setEditandoServ(null);
    setModalMsgServ(null);
  };

  const handleGuardarServ = async () => {
    if (!formServ.nombre || !formServ.precio) {
      setModalMsgServ({
        tipo: "err",
        texto: "Nombre y precio son obligatorios.",
      });
      return;
    }
    setGuardandoServ(true);
    setModalMsgServ(null);
    try {
      if (editandoServ) {
        await editarServicio(editandoServ.id_servicio, formServ);
        mostrarMsg("ok", "Servicio actualizado.");
      } else {
        await crearServicio(formServ);
        mostrarMsg("ok", "Servicio creado.");
      }
      cargarDatos();
      cerrarModalServ();
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data ?? {})[0]?.[0] ||
        "Error al guardar.";
      setModalMsgServ({ tipo: "err", texto: detail });
    } finally {
      setGuardandoServ(false);
    }
  };

  const handleEliminarServ = async (id) => {
    if (!confirm("¿Eliminar este servicio?")) return;
    try {
      await eliminarServicio(id);
      mostrarMsg("ok", "Servicio eliminado.");
      cargarDatos();
    } catch {
      mostrarMsg("err", "No se pudo eliminar el servicio.");
    }
  };

  // ── Pagos ─────────────────────────────────────────────────────
  const abrirCrearPago = () => {
    setFormPago({
      ...PAGO_INICIAL,
      fecha: new Date().toISOString().split("T")[0],
    });
    setServiciosElegidos([]);
    setModalMsgPago(null);
    setModalPago(true);
  };

  const cerrarModalPago = () => {
    setModalPago(false);
    setModalMsgPago(null);
  };

  const toggleServicioPago = (servicio) => {
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

  const handleGuardarPago = async () => {
    if (!formPago.id_nino) {
      setModalMsgPago({ tipo: "err", texto: "Seleccioná un niño." });
      return;
    }
    if (!serviciosElegidos.length) {
      setModalMsgPago({
        tipo: "err",
        texto: "Seleccioná al menos un servicio.",
      });
      return;
    }
    setGuardandoPago(true);
    setModalMsgPago(null);
    try {
      await crearPago({
        id_nino: formPago.id_nino,
        fecha: formPago.fecha,
        estado: formPago.estado,
        detalles: serviciosElegidos,
      });
      mostrarMsg("ok", "Pago registrado correctamente.");
      cargarDatos();
      cerrarModalPago();
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data ?? {})[0]?.[0] ||
        "Error al guardar.";
      setModalMsgPago({ tipo: "err", texto: detail });
    } finally {
      setGuardandoPago(false);
    }
  };

  const handleMarcarPagado = async (id) => {
    try {
      await marcarPagado(id);
      mostrarMsg("ok", "Pago marcado como pagado.");
      cargarDatos();
    } catch (err) {
      mostrarMsg(
        "err",
        err.response?.data?.detail ?? "Error al marcar como pagado.",
      );
    }
  };

  const handleEliminarPago = async (id) => {
    if (!confirm("¿Anular este pago?")) return;
    try {
      await eliminarPago(id);
      mostrarMsg("ok", "Pago anulado.");
      cargarDatos();
    } catch {
      mostrarMsg("err", "No se pudo anular el pago.");
    }
  };

  const handleGenerarMensual = async () => {
    if (!confirm(`¿Generar pagos mensuales para ${mesActual}/${anioActual}?`))
      return;
    setGenerando(true);
    try {
      const { data } = await generarMensual({
        mes: mesActual,
        anio: anioActual,
      });
      mostrarMsg("ok", data.detail);
      cargarDatos();
    } catch (err) {
      mostrarMsg(
        "err",
        err.response?.data?.detail ?? "Error al generar pagos.",
      );
    } finally {
      setGenerando(false);
    }
  };

  const totalElegido = serviciosElegidos.reduce(
    (acc, s) => acc + parseFloat(s.monto),
    0,
  );

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Servicios y pagos</h1>
        <div style={{ display: "flex", gap: 10 }}>
          {tab === "servicios" && (
            <button className={styles.btnPrimary} onClick={abrirCrearServ}>
              + Nuevo servicio
            </button>
          )}
          {tab === "pagos" && (
            <button className={styles.btnPrimary} onClick={abrirCrearPago}>
              + Registrar pago
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className={msg.tipo === "ok" ? styles.msgOk : styles.msgErr}>
          {msg.texto}
        </div>
      )}

      {/* Resumen del mes */}
      {tab === "pagos" && resumen && (
        <div className={styles.resumenGrid}>
          <div className={`${styles.resumenCard} ${styles.green}`}>
            <div className={styles.resumenIcon}>◎</div>
            <div className={styles.resumenBody}>
              <span className={styles.resumenValue}>
                Bs. {parseFloat(resumen.total_pagado).toFixed(2)}
              </span>
              <span className={styles.resumenLabel}>Cobrado este mes</span>
            </div>
          </div>
          <div className={`${styles.resumenCard} ${styles.amber}`}>
            <div className={styles.resumenIcon}>◷</div>
            <div className={styles.resumenBody}>
              <span className={styles.resumenValue}>{resumen.pendientes}</span>
              <span className={styles.resumenLabel}>Pagos pendientes</span>
            </div>
          </div>
          <div className={`${styles.resumenCard} ${styles.red}`}>
            <div className={styles.resumenIcon}>✕</div>
            <div className={styles.resumenBody}>
              <span className={styles.resumenValue}>{resumen.anulados}</span>
              <span className={styles.resumenLabel}>Pagos anulados</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "servicios" ? styles.active : ""}`}
          onClick={() => {
            setTab("servicios");
            setBusqueda("");
            setFiltroTipo("");
          }}
        >
          Servicios
        </button>
        <button
          className={`${styles.tab} ${tab === "pagos" ? styles.active : ""}`}
          onClick={() => {
            setTab("pagos");
            setBusqueda("");
            setFiltroEstado("");
          }}
        >
          Pagos
        </button>
      </div>

      {/* ── TAB SERVICIOS ── */}
      {tab === "servicios" && (
        <>
          <div className={styles.filters}>
            <input
              type="text"
              placeholder="Buscar servicio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={styles.searchInput}
            />
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className={styles.select}
            >
              <option value="">Todos los tipos</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
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
              {serviciosFiltrados.length} servicio
              {serviciosFiltrados.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Precio</th>
                  <th>Descripción</th>
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
                {!loading && !serviciosFiltrados.length && (
                  <tr>
                    <td colSpan={6} className={styles.empty}>
                      No hay servicios registrados.
                    </td>
                  </tr>
                )}
                {serviciosFiltrados.map((s) => (
                  <tr key={s.id_servicio}>
                    <td style={{ fontWeight: 500 }}>{s.nombre}</td>
                    <td>
                      <span
                        className={`${styles.tipoBadge} ${tipoClass(s.tipo)}`}
                      >
                        {s.tipo.charAt(0).toUpperCase() + s.tipo.slice(1)}
                      </span>
                    </td>
                    <td
                      style={{
                        fontWeight: 600,
                        color: "var(--color-primary-dk)",
                      }}
                    >
                      Bs. {parseFloat(s.precio).toFixed(2)}
                    </td>
                    <td
                      style={{
                        color: "var(--color-text-muted)",
                        maxWidth: 200,
                      }}
                    >
                      {s.descripcion ?? "—"}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          padding: "3px 8px",
                          borderRadius: 10,
                          background: s.activo ? "#EAF3DE" : "#F1EFE8",
                          color: s.activo ? "#3B6D11" : "#5F5E5A",
                        }}
                      >
                        {s.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.btnIcon}
                          onClick={() => abrirEditarServ(s)}
                        >
                          Editar
                        </button>
                        <button
                          className={styles.btnDanger}
                          onClick={() => handleEliminarServ(s.id_servicio)}
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

      {/* ── TAB PAGOS ── */}
      {tab === "pagos" && (
        <>
          {/* Generar mensual */}
          <div className={styles.generarCard}>
            <div className={styles.generarInfo}>
              <span className={styles.generarTitle}>
                Generar cobros mensuales
              </span>
              <span className={styles.generarDesc}>
                Crea automáticamente los pagos pendientes del mes actual para
                todos los niños con servicios mensuales asignados.
              </span>
            </div>
            <button
              className={styles.btnPrimary}
              onClick={handleGenerarMensual}
              disabled={generando}
              style={{ whiteSpace: "nowrap" }}
            >
              {generando
                ? "Generando..."
                : `Generar ${mesActual}/${anioActual}`}
            </button>
          </div>

          <div className={styles.filters}>
            <input
              type="text"
              placeholder="Buscar por nombre del niño..."
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
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="anulado">Anulado</option>
            </select>
            <span
              style={{
                fontSize: 13,
                color: "var(--color-text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              {pagosFiltrados.length} pago
              {pagosFiltrados.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Niño</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Items</th>
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
                {!loading && !pagosFiltrados.length && (
                  <tr>
                    <td colSpan={6} className={styles.empty}>
                      No hay pagos registrados.
                    </td>
                  </tr>
                )}
                {pagosFiltrados.map((p) => (
                  <tr key={p.id_pago}>
                    <td style={{ fontWeight: 500 }}>{p.nino_nombre}</td>
                    <td>{p.fecha}</td>
                    <td
                      style={{
                        fontWeight: 700,
                        color: "var(--color-primary-dk)",
                      }}
                    >
                      Bs. {parseFloat(p.total).toFixed(2)}
                    </td>
                    <td style={{ color: "var(--color-text-muted)" }}>
                      {p.cantidad_items} servicio
                      {p.cantidad_items !== 1 ? "s" : ""}
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
                            onClick={() => handleMarcarPagado(p.id_pago)}
                          >
                            Marcar pagado
                          </button>
                        )}
                        {p.estado !== "anulado" && (
                          <button
                            className={styles.btnDanger}
                            onClick={() => handleEliminarPago(p.id_pago)}
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

      {/* ── MODAL CREAR / EDITAR SERVICIO ── */}
      {modalServ && (
        <div className={styles.overlay} onClick={cerrarModalServ}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {editandoServ ? "Editar servicio" : "Nuevo servicio"}
              </span>
              <button className={styles.btnClose} onClick={cerrarModalServ}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {modalMsgServ && (
                <div
                  className={
                    modalMsgServ.tipo === "ok" ? styles.msgOk : styles.msgErr
                  }
                >
                  {modalMsgServ.texto}
                </div>
              )}
              <div className={styles.formGrid}>
                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Nombre *</label>
                  <input
                    value={formServ.nombre}
                    onChange={(e) =>
                      setFormServ((p) => ({ ...p, nombre: e.target.value }))
                    }
                    className={styles.input}
                    placeholder="Nombre del servicio"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Tipo *</label>
                  <select
                    value={formServ.tipo}
                    onChange={(e) =>
                      setFormServ((p) => ({ ...p, tipo: e.target.value }))
                    }
                    className={styles.select2}
                  >
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Precio (Bs.) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formServ.precio}
                    onChange={(e) =>
                      setFormServ((p) => ({ ...p, precio: e.target.value }))
                    }
                    className={styles.input}
                    placeholder="0.00"
                  />
                </div>
                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Descripción</label>
                  <textarea
                    value={formServ.descripcion}
                    onChange={(e) =>
                      setFormServ((p) => ({
                        ...p,
                        descripcion: e.target.value,
                      }))
                    }
                    className={styles.textarea}
                    placeholder="Descripción del servicio"
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={cerrarModalServ}>
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleGuardarServ}
                disabled={guardandoServ}
              >
                {guardandoServ
                  ? "Guardando..."
                  : editandoServ
                    ? "Guardar cambios"
                    : "Crear servicio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL REGISTRAR PAGO ── */}
      {modalPago && (
        <div className={styles.overlay} onClick={cerrarModalPago}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Registrar pago</span>
              <button className={styles.btnClose} onClick={cerrarModalPago}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {modalMsgPago && (
                <div
                  className={
                    modalMsgPago.tipo === "ok" ? styles.msgOk : styles.msgErr
                  }
                >
                  {modalMsgPago.texto}
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
                        onClick={() => toggleServicioPago(s)}
                      >
                        <input
                          type="checkbox"
                          readOnly
                          checked={!!elegido}
                          style={{ flexShrink: 0 }}
                        />
                        <span className={styles.detalleNombre}>{s.nombre}</span>
                        <span
                          className={`${styles.tipoBadge} ${tipoClass(s.tipo)}`}
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
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Total</span>
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
              <button className={styles.btnSecondary} onClick={cerrarModalPago}>
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleGuardarPago}
                disabled={guardandoPago}
              >
                {guardandoPago ? "Guardando..." : "Registrar pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
