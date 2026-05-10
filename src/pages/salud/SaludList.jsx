import { useEffect, useState, useCallback } from "react";
import {
  getRegistrosSalud,
  crearRegistroSalud,
  editarRegistroSalud,
  eliminarRegistroSalud,
  getAlertasHoy,
  getMedicaciones,
  crearMedicacion,
  editarMedicacion,
  eliminarMedicacion,
  getMedicacionesHoy,
  getAlimentaciones,
  crearAlimentacion,
  editarAlimentacion,
  eliminarAlimentacion,
  getNinos,
} from "../../api/saludApi";
import styles from "./Salud.module.css";

const SALUD_INICIAL = {
  id_nino: "",
  fecha: new Date().toISOString().split("T")[0],
  sintomas: "",
  observaciones: "",
};

const MED_INICIAL = {
  id_nino: "",
  medicamento: "",
  dosis: "",
  hora: "",
};

const ALIM_INICIAL = {
  id_nino: "",
  tipo_comida: "",
  horario: "",
  observaciones: "",
};

export default function SaludList() {
  const [tab, setTab] = useState("alertas");
  const [registros, setRegistros] = useState([]);
  const [alertasHoy, setAlertasHoy] = useState([]);
  const [medicaciones, setMedicaciones] = useState([]);
  const [medHoy, setMedHoy] = useState([]);
  const [alimentaciones, setAlimentaciones] = useState([]);
  const [ninos, setNinos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroNino, setFiltroNino] = useState("");
  const [msg, setMsg] = useState(null);

  // Modal salud
  const [modalSalud, setModalSalud] = useState(false);
  const [editandoSalud, setEditandoSalud] = useState(null);
  const [formSalud, setFormSalud] = useState(SALUD_INICIAL);
  const [guardandoSalud, setGuardandoSalud] = useState(false);
  const [modalMsgSalud, setModalMsgSalud] = useState(null);

  // Modal medicación
  const [modalMed, setModalMed] = useState(false);
  const [editandoMed, setEditandoMed] = useState(null);
  const [formMed, setFormMed] = useState(MED_INICIAL);
  const [guardandoMed, setGuardandoMed] = useState(false);
  const [modalMsgMed, setModalMsgMed] = useState(null);

  // Modal alimentación
  const [modalAlim, setModalAlim] = useState(false);
  const [editandoAlim, setEditandoAlim] = useState(null);
  const [formAlim, setFormAlim] = useState(ALIM_INICIAL);
  const [guardandoAlim, setGuardandoAlim] = useState(false);
  const [modalMsgAlim, setModalMsgAlim] = useState(null);

  const mostrarMsg = (tipo, texto) => {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg(null), 3500);
  };

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [r, a, m, mh, al, n] = await Promise.all([
        getRegistrosSalud(),
        getAlertasHoy(),
        getMedicaciones(),
        getMedicacionesHoy(),
        getAlimentaciones(),
        getNinos(),
      ]);
      setRegistros(r.data.results ?? r.data);
      setAlertasHoy(a.data.alertas ?? []);
      setMedicaciones(m.data.results ?? m.data);
      setMedHoy(mh.data);
      setAlimentaciones(al.data.results ?? al.data);
      setNinos(n.data.results ?? n.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Filtros
  const registrosFiltrados = registros.filter((r) => {
    const matchBusq =
      r.nino_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.sintomas?.toLowerCase().includes(busqueda.toLowerCase());
    const matchNino = filtroNino ? String(r.id_nino) === filtroNino : true;
    return matchBusq && matchNino;
  });

  const medicacionesFiltradas = medicaciones.filter((m) => {
    const matchBusq =
      m.nino_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.medicamento?.toLowerCase().includes(busqueda.toLowerCase());
    const matchNino = filtroNino ? String(m.id_nino) === filtroNino : true;
    return matchBusq && matchNino;
  });

  const alimentacionesFiltradas = alimentaciones.filter((a) => {
    const matchBusq =
      a.nino_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.tipo_comida?.toLowerCase().includes(busqueda.toLowerCase());
    const matchNino = filtroNino ? String(a.id_nino) === filtroNino : true;
    return matchBusq && matchNino;
  });

  // ── CRUD Salud ────────────────────────────────────────────────
  const abrirCrearSalud = () => {
    setEditandoSalud(null);
    setFormSalud({
      ...SALUD_INICIAL,
      fecha: new Date().toISOString().split("T")[0],
    });
    setModalMsgSalud(null);
    setModalSalud(true);
  };

  const abrirEditarSalud = (r) => {
    setEditandoSalud(r);
    setFormSalud({
      id_nino: r.id_nino,
      fecha: r.fecha,
      sintomas: r.sintomas ?? "",
      observaciones: r.observaciones ?? "",
    });
    setModalMsgSalud(null);
    setModalSalud(true);
  };

  const cerrarModalSalud = () => {
    setModalSalud(false);
    setEditandoSalud(null);
    setModalMsgSalud(null);
  };

  const handleGuardarSalud = async () => {
    if (!formSalud.id_nino || !formSalud.fecha || !formSalud.sintomas) {
      setModalMsgSalud({
        tipo: "err",
        texto: "Niño, fecha y síntomas son obligatorios.",
      });
      return;
    }
    setGuardandoSalud(true);
    setModalMsgSalud(null);
    try {
      if (editandoSalud) {
        await editarRegistroSalud(editandoSalud.id_salud, formSalud);
        mostrarMsg("ok", "Registro actualizado.");
      } else {
        await crearRegistroSalud(formSalud);
        mostrarMsg("ok", "Registro de salud creado.");
      }
      cargarDatos();
      cerrarModalSalud();
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data ?? {})[0]?.[0] ||
        "Error al guardar.";
      setModalMsgSalud({ tipo: "err", texto: detail });
    } finally {
      setGuardandoSalud(false);
    }
  };

  const handleEliminarSalud = async (id) => {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      await eliminarRegistroSalud(id);
      mostrarMsg("ok", "Registro eliminado.");
      cargarDatos();
    } catch {
      mostrarMsg("err", "No se pudo eliminar.");
    }
  };

  // ── CRUD Medicación ───────────────────────────────────────────
  const abrirCrearMed = () => {
    setEditandoMed(null);
    setFormMed(MED_INICIAL);
    setModalMsgMed(null);
    setModalMed(true);
  };

  const abrirEditarMed = (m) => {
    setEditandoMed(m);
    setFormMed({
      id_nino: m.id_nino,
      medicamento: m.medicamento,
      dosis: m.dosis,
      hora: m.hora,
    });
    setModalMsgMed(null);
    setModalMed(true);
  };

  const cerrarModalMed = () => {
    setModalMed(false);
    setEditandoMed(null);
    setModalMsgMed(null);
  };

  const handleGuardarMed = async () => {
    if (
      !formMed.id_nino ||
      !formMed.medicamento ||
      !formMed.dosis ||
      !formMed.hora
    ) {
      setModalMsgMed({
        tipo: "err",
        texto: "Todos los campos son obligatorios.",
      });
      return;
    }
    setGuardandoMed(true);
    setModalMsgMed(null);
    try {
      if (editandoMed) {
        await editarMedicacion(editandoMed.id_medicacion, formMed);
        mostrarMsg("ok", "Medicación actualizada.");
      } else {
        await crearMedicacion(formMed);
        mostrarMsg("ok", "Medicación registrada.");
      }
      cargarDatos();
      cerrarModalMed();
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data ?? {})[0]?.[0] ||
        "Error al guardar.";
      setModalMsgMed({ tipo: "err", texto: detail });
    } finally {
      setGuardandoMed(false);
    }
  };

  const handleEliminarMed = async (id) => {
    if (!confirm("¿Eliminar esta medicación?")) return;
    try {
      await eliminarMedicacion(id);
      mostrarMsg("ok", "Medicación eliminada.");
      cargarDatos();
    } catch {
      mostrarMsg("err", "No se pudo eliminar.");
    }
  };

  // ── CRUD Alimentación ─────────────────────────────────────────
  const abrirCrearAlim = () => {
    setEditandoAlim(null);
    setFormAlim(ALIM_INICIAL);
    setModalMsgAlim(null);
    setModalAlim(true);
  };

  const abrirEditarAlim = (a) => {
    setEditandoAlim(a);
    setFormAlim({
      id_nino: a.id_nino,
      tipo_comida: a.tipo_comida,
      horario: a.horario,
      observaciones: a.observaciones ?? "",
    });
    setModalMsgAlim(null);
    setModalAlim(true);
  };

  const cerrarModalAlim = () => {
    setModalAlim(false);
    setEditandoAlim(null);
    setModalMsgAlim(null);
  };

  const handleGuardarAlim = async () => {
    if (!formAlim.id_nino || !formAlim.tipo_comida || !formAlim.horario) {
      setModalMsgAlim({
        tipo: "err",
        texto: "Niño, tipo de comida y horario son obligatorios.",
      });
      return;
    }
    setGuardandoAlim(true);
    setModalMsgAlim(null);
    try {
      if (editandoAlim) {
        await editarAlimentacion(editandoAlim.id_alimentacion, formAlim);
        mostrarMsg("ok", "Alimentación actualizada.");
      } else {
        await crearAlimentacion(formAlim);
        mostrarMsg("ok", "Alimentación registrada.");
      }
      cargarDatos();
      cerrarModalAlim();
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data ?? {})[0]?.[0] ||
        "Error al guardar.";
      setModalMsgAlim({ tipo: "err", texto: detail });
    } finally {
      setGuardandoAlim(false);
    }
  };

  const handleEliminarAlim = async (id) => {
    if (!confirm("¿Eliminar este registro de alimentación?")) return;
    try {
      await eliminarAlimentacion(id);
      mostrarMsg("ok", "Alimentación eliminada.");
      cargarDatos();
    } catch {
      mostrarMsg("err", "No se pudo eliminar.");
    }
  };

  const filtros = (
    <div className={styles.filters}>
      <input
        type="text"
        placeholder="Buscar..."
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
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Salud</h1>
        <div style={{ display: "flex", gap: 10 }}>
          {tab === "registros" && (
            <button className={styles.btnPrimary} onClick={abrirCrearSalud}>
              + Nuevo registro
            </button>
          )}
          {tab === "medicacion" && (
            <button className={styles.btnPrimary} onClick={abrirCrearMed}>
              + Nueva medicación
            </button>
          )}
          {tab === "alimentacion" && (
            <button className={styles.btnPrimary} onClick={abrirCrearAlim}>
              + Nueva alimentación
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className={msg.tipo === "ok" ? styles.msgOk : styles.msgErr}>
          {msg.texto}
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { key: "alertas", label: `Alertas hoy (${alertasHoy.length})` },
          { key: "registros", label: "Registros" },
          { key: "medicacion", label: `Medicación hoy (${medHoy.length})` },
          { key: "alimentacion", label: "Alimentación" },
        ].map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.active : ""}`}
            onClick={() => {
              setTab(t.key);
              setBusqueda("");
              setFiltroNino("");
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB ALERTAS HOY ── */}
      {tab === "alertas" && (
        <>
          {!loading && !alertasHoy.length && (
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
              Sin alertas de salud hoy. ✓
            </div>
          )}
          <div className={styles.alertasGrid}>
            {alertasHoy.map((a) => (
              <div key={a.id_salud} className={styles.alertaCard}>
                <div className={styles.alertaCardHeader}>
                  <span className={styles.alertaCardNino}>{a.nino_nombre}</span>
                  <span className={styles.alertaCardFecha}>{a.fecha}</span>
                </div>
                <p className={styles.alertaCardSintomas}>
                  <strong>Síntomas:</strong> {a.sintomas}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── TAB REGISTROS ── */}
      {tab === "registros" && (
        <>
          {filtros}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Niño</th>
                  <th>Fecha</th>
                  <th>Síntomas</th>
                  <th>Observaciones</th>
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
                {!loading && !registrosFiltrados.length && (
                  <tr>
                    <td colSpan={5} className={styles.empty}>
                      No hay registros.
                    </td>
                  </tr>
                )}
                {registrosFiltrados.map((r) => (
                  <tr key={r.id_salud}>
                    <td style={{ fontWeight: 500 }}>{r.nino_nombre}</td>
                    <td>{r.fecha}</td>
                    <td style={{ maxWidth: 200, color: "#A32D2D" }}>
                      {r.sintomas ?? "—"}
                    </td>
                    <td
                      style={{
                        maxWidth: 200,
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {r.observaciones ?? "—"}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.btnIcon}
                          onClick={() => abrirEditarSalud(r)}
                        >
                          Editar
                        </button>
                        <button
                          className={styles.btnDanger}
                          onClick={() => handleEliminarSalud(r.id_salud)}
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

      {/* ── TAB MEDICACIÓN HOY ── */}
      {tab === "medicacion" && (
        <>
          {medHoy.length > 0 && (
            <div>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                  marginBottom: 12,
                }}
              >
                Próximas medicaciones del día
              </p>
              <div className={styles.medHoyGrid}>
                {medHoy.map((m) => (
                  <div key={m.id_medicacion} className={styles.medHoyCard}>
                    <span className={styles.medHoyNino}>{m.nino_nombre}</span>
                    <span className={styles.medHoyMed}>{m.medicamento}</span>
                    <span className={styles.medHoyDosis}>{m.dosis}</span>
                    <span className={styles.medHoyHora}>◷ {m.hora}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filtros}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Niño</th>
                  <th>Medicamento</th>
                  <th>Dosis</th>
                  <th>Hora</th>
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
                {!loading && !medicacionesFiltradas.length && (
                  <tr>
                    <td colSpan={5} className={styles.empty}>
                      No hay medicaciones registradas.
                    </td>
                  </tr>
                )}
                {medicacionesFiltradas.map((m) => (
                  <tr key={m.id_medicacion}>
                    <td style={{ fontWeight: 500 }}>{m.nino_nombre}</td>
                    <td style={{ fontWeight: 500 }}>{m.medicamento}</td>
                    <td>{m.dosis}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "#854F0B",
                          background: "#FAEEDA",
                          padding: "3px 8px",
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                      >
                        {m.hora}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.btnIcon}
                          onClick={() => abrirEditarMed(m)}
                        >
                          Editar
                        </button>
                        <button
                          className={styles.btnDanger}
                          onClick={() => handleEliminarMed(m.id_medicacion)}
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

      {/* ── TAB ALIMENTACIÓN ── */}
      {tab === "alimentacion" && (
        <>
          {filtros}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Niño</th>
                  <th>Tipo de comida</th>
                  <th>Horario</th>
                  <th>Observaciones</th>
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
                {!loading && !alimentacionesFiltradas.length && (
                  <tr>
                    <td colSpan={5} className={styles.empty}>
                      No hay registros de alimentación.
                    </td>
                  </tr>
                )}
                {alimentacionesFiltradas.map((a) => (
                  <tr key={a.id_alimentacion}>
                    <td style={{ fontWeight: 500 }}>{a.nino_nombre}</td>
                    <td
                      style={{ fontWeight: 500, textTransform: "capitalize" }}
                    >
                      {a.tipo_comida}
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "#3B6D11",
                          background: "#EAF3DE",
                          padding: "3px 8px",
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                      >
                        {a.horario}
                      </span>
                    </td>
                    <td style={{ color: "var(--color-text-muted)" }}>
                      {a.observaciones ?? "—"}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.btnIcon}
                          onClick={() => abrirEditarAlim(a)}
                        >
                          Editar
                        </button>
                        <button
                          className={styles.btnDanger}
                          onClick={() => handleEliminarAlim(a.id_alimentacion)}
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

      {/* ── MODAL SALUD ── */}
      {modalSalud && (
        <div className={styles.overlay} onClick={cerrarModalSalud}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {editandoSalud ? "Editar registro" : "Nuevo registro de salud"}
              </span>
              <button className={styles.btnClose} onClick={cerrarModalSalud}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              {modalMsgSalud && (
                <div
                  className={
                    modalMsgSalud.tipo === "ok" ? styles.msgOk : styles.msgErr
                  }
                >
                  {modalMsgSalud.texto}
                </div>
              )}
              <div className={styles.formGrid}>
                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Niño *</label>
                  <select
                    value={formSalud.id_nino}
                    onChange={(e) =>
                      setFormSalud((p) => ({ ...p, id_nino: e.target.value }))
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
                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Fecha *</label>
                  <input
                    type="date"
                    value={formSalud.fecha}
                    onChange={(e) =>
                      setFormSalud((p) => ({ ...p, fecha: e.target.value }))
                    }
                    className={styles.input}
                  />
                </div>
                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Síntomas *</label>
                  <textarea
                    value={formSalud.sintomas}
                    onChange={(e) =>
                      setFormSalud((p) => ({ ...p, sintomas: e.target.value }))
                    }
                    className={styles.textarea}
                    placeholder="Describí los síntomas observados..."
                  />
                </div>
                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Observaciones</label>
                  <textarea
                    value={formSalud.observaciones}
                    onChange={(e) =>
                      setFormSalud((p) => ({
                        ...p,
                        observaciones: e.target.value,
                      }))
                    }
                    className={styles.textarea}
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnSecondary}
                onClick={cerrarModalSalud}
              >
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleGuardarSalud}
                disabled={guardandoSalud}
              >
                {guardandoSalud
                  ? "Guardando..."
                  : editandoSalud
                    ? "Guardar cambios"
                    : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL MEDICACIÓN ── */}
      {modalMed && (
        <div className={styles.overlay} onClick={cerrarModalMed}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {editandoMed ? "Editar medicación" : "Nueva medicación"}
              </span>
              <button className={styles.btnClose} onClick={cerrarModalMed}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              {modalMsgMed && (
                <div
                  className={
                    modalMsgMed.tipo === "ok" ? styles.msgOk : styles.msgErr
                  }
                >
                  {modalMsgMed.texto}
                </div>
              )}
              <div className={styles.formGrid}>
                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Niño *</label>
                  <select
                    value={formMed.id_nino}
                    onChange={(e) =>
                      setFormMed((p) => ({ ...p, id_nino: e.target.value }))
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
                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Medicamento *</label>
                  <input
                    value={formMed.medicamento}
                    onChange={(e) =>
                      setFormMed((p) => ({ ...p, medicamento: e.target.value }))
                    }
                    className={styles.input}
                    placeholder="Nombre del medicamento"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Dosis *</label>
                  <input
                    value={formMed.dosis}
                    onChange={(e) =>
                      setFormMed((p) => ({ ...p, dosis: e.target.value }))
                    }
                    className={styles.input}
                    placeholder="Ej: 5ml, 1 comprimido"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Hora *</label>
                  <input
                    type="time"
                    value={formMed.hora}
                    onChange={(e) =>
                      setFormMed((p) => ({ ...p, hora: e.target.value }))
                    }
                    className={styles.input}
                  />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={cerrarModalMed}>
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleGuardarMed}
                disabled={guardandoMed}
              >
                {guardandoMed
                  ? "Guardando..."
                  : editandoMed
                    ? "Guardar cambios"
                    : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ALIMENTACIÓN ── */}
      {modalAlim && (
        <div className={styles.overlay} onClick={cerrarModalAlim}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {editandoAlim ? "Editar alimentación" : "Nueva alimentación"}
              </span>
              <button className={styles.btnClose} onClick={cerrarModalAlim}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              {modalMsgAlim && (
                <div
                  className={
                    modalMsgAlim.tipo === "ok" ? styles.msgOk : styles.msgErr
                  }
                >
                  {modalMsgAlim.texto}
                </div>
              )}
              <div className={styles.formGrid}>
                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Niño *</label>
                  <select
                    value={formAlim.id_nino}
                    onChange={(e) =>
                      setFormAlim((p) => ({ ...p, id_nino: e.target.value }))
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
                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Tipo de comida *</label>
                  <input
                    value={formAlim.tipo_comida}
                    onChange={(e) =>
                      setFormAlim((p) => ({
                        ...p,
                        tipo_comida: e.target.value,
                      }))
                    }
                    className={styles.input}
                    placeholder="Ej: Desayuno, Almuerzo, Merienda"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Horario *</label>
                  <input
                    type="time"
                    value={formAlim.horario}
                    onChange={(e) =>
                      setFormAlim((p) => ({ ...p, horario: e.target.value }))
                    }
                    className={styles.input}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Observaciones</label>
                  <input
                    value={formAlim.observaciones}
                    onChange={(e) =>
                      setFormAlim((p) => ({
                        ...p,
                        observaciones: e.target.value,
                      }))
                    }
                    className={styles.input}
                    placeholder="Alergias, restricciones..."
                  />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={cerrarModalAlim}>
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleGuardarAlim}
                disabled={guardandoAlim}
              >
                {guardandoAlim
                  ? "Guardando..."
                  : editandoAlim
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
