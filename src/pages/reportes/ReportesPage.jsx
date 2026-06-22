import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import api from "../../api/axiosConfig";
import PanelVoz from "./PanelVoz";

// ── Configuración de módulos ──────────────────────────────────────────────────
const MODULOS = {
  asistencia: {
    label: "Asistencia",
    endpoint: "/asistencia/",
    columnas: [
      { key: "nino_nombre", label: "Niño" },
      { key: "fecha", label: "Fecha" },
      { key: "estado", label: "Estado" },
      { key: "hora_ingreso", label: "Hora ingreso" },
      { key: "hora_salida", label: "Hora salida" },
    ],
    filtros: ["fecha_desde", "fecha_hasta", "estado"],
  },
  ninos: {
    label: "Niños",
    endpoint: "/ninos/",
    columnas: [
      { key: "nombre", label: "Nombre" },
      { key: "fecha_nacimiento", label: "Fecha nacimiento" },
      { key: "edad", label: "Edad" },
      { key: "info_medica", label: "Info médica" },
      { key: "activo", label: "Estado" },
    ],
    filtros: ["activo"],
  },
  salud: {
    label: "Salud",
    endpoint: "/salud/registros/",
    columnas: [
      { key: "nino_nombre", label: "Niño" },
      { key: "fecha", label: "Fecha" },
      { key: "sintomas", label: "Síntomas" },
      { key: "observaciones", label: "Observaciones" },
    ],
    filtros: ["fecha_desde", "fecha_hasta"],
  },
  pagos: {
    label: "Pagos",
    endpoint: "/servicios/pagos/",
    columnas: [
      { key: "nino_nombre", label: "Niño" },
      { key: "fecha", label: "Fecha" },
      { key: "total", label: "Total (Bs.)" },
      { key: "estado", label: "Estado" },
      { key: "cantidad_items", label: "Servicios" },
    ],
    filtros: ["fecha_desde", "fecha_hasta", "estado"],
  },
  actividades: {
    label: "Actividades",
    endpoint: "/actividades/",
    columnas: [
      { key: "nino_nombre", label: "Niño" },
      { key: "tipo_display", label: "Tipo" },
      { key: "descripcion", label: "Descripción" },
      { key: "fecha", label: "Fecha" },
    ],
    filtros: ["fecha_desde", "fecha_hasta", "tipo"],
  },
};

const TIPOS_ACTIVIDAD = [
  "pedagogica",
  "recreativa",
  "deportiva",
  "artistica",
  "social",
  "otro",
];
const ESTADOS_ASISTENCIA = ["presente", "ausente", "tardanza"];
const ESTADOS_PAGO = ["pendiente", "pagado", "anulado"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatearValor(key, valor) {
  if (valor === null || valor === undefined) return "—";
  if (key === "activo") return valor ? "Activo" : "Inactivo";
  if (key === "total") return `Bs. ${parseFloat(valor).toFixed(2)}`;
  if (key === "hora_ingreso" || key === "hora_salida")
    return valor ? valor.slice(0, 5) : "—";
  return String(valor);
}

function colorEstado(key, valor) {
  if (key === "estado") {
    if (valor === "presente" || valor === "pagado")
      return { background: "#EAF3DE", color: "#3B6D11" };
    if (valor === "ausente" || valor === "anulado")
      return { background: "#FCEBEB", color: "#A32D2D" };
    if (valor === "tardanza" || valor === "pendiente")
      return { background: "#FAEEDA", color: "#854F0B" };
  }
  if (key === "activo") {
    return valor
      ? { background: "#EAF3DE", color: "#3B6D11" }
      : { background: "#FCEBEB", color: "#A32D2D" };
  }
  return null;
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = {
  page: { display: "flex", flexDirection: "column", gap: 24 },
  pageTitle: { fontSize: 22, fontWeight: 600, color: "var(--color-text)" },

  // Tabs
  tabs: {
    display: "flex",
    gap: 4,
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    padding: 4,
    alignSelf: "flex-start",
  },
  tab: (activo) => ({
    padding: "7px 18px",
    fontSize: 14,
    fontWeight: 500,
    border: "none",
    borderRadius: "var(--radius-sm)",
    background: activo ? "var(--color-surface)" : "none",
    color: activo ? "var(--color-text)" : "var(--color-text-muted)",
    cursor: "pointer",
    boxShadow: activo ? "0 1px 4px rgba(0,0,0,.08)" : "none",
    transition: "all .15s",
  }),

  card: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: 600, color: "var(--color-text)" },

  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },

  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: "var(--color-text)" },
  input: {
    padding: "9px 12px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    fontSize: 14,
    color: "var(--color-text)",
    background: "var(--color-bg)",
    outline: "none",
    fontFamily: "inherit",
  },
  select: {
    padding: "9px 12px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    fontSize: 14,
    color: "var(--color-text)",
    background: "var(--color-bg)",
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
  },

  // Módulos
  modulosGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 10,
  },
  moduloBtn: (activo) => ({
    padding: "12px 8px",
    border: `2px solid ${activo ? "var(--color-primary)" : "var(--color-border)"}`,
    borderRadius: "var(--radius-md)",
    background: activo ? "#E1F5EE" : "var(--color-bg)",
    color: activo ? "var(--color-primary-dk)" : "var(--color-text-muted)",
    fontWeight: activo ? 600 : 400,
    fontSize: 13,
    cursor: "pointer",
    textAlign: "center",
    transition: "all .15s",
  }),

  // Columnas
  columnasGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  columnaChip: (activo) => ({
    padding: "6px 14px",
    border: `1px solid ${activo ? "var(--color-primary)" : "var(--color-border)"}`,
    borderRadius: 20,
    background: activo ? "#E1F5EE" : "var(--color-bg)",
    color: activo ? "var(--color-primary-dk)" : "var(--color-text-muted)",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: activo ? 500 : 400,
    transition: "all .15s",
  }),

  // Botones
  btnPrimary: {
    padding: "10px 20px",
    background: "var(--color-primary)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-sm)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  btnDanger: {
    padding: "10px 20px",
    background: "#E24B4A",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-sm)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  btnSuccess: {
    padding: "10px 20px",
    background: "#1D9E75",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-sm)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },

  // Tabla
  tableWrap: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
    overflowX: "auto",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    background: "var(--color-bg)",
    padding: "11px 16px",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--color-text-muted)",
    textTransform: "uppercase",
    letterSpacing: ".04em",
    borderBottom: "1px solid var(--color-border)",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 16px",
    fontSize: 14,
    color: "var(--color-text)",
    borderBottom: "1px solid var(--color-border)",
    verticalAlign: "middle",
  },

  // Mensajes
  msgOk: {
    padding: "10px 14px",
    background: "#EAF3DE",
    border: "1px solid #97C459",
    borderRadius: "var(--radius-sm)",
    fontSize: 13,
    color: "#3B6D11",
  },
  msgErr: {
    padding: "10px 14px",
    background: "#FCEBEB",
    border: "1px solid #F09595",
    borderRadius: "var(--radius-sm)",
    fontSize: 13,
    color: "#A32D2D",
  },
  empty: {
    padding: 40,
    textAlign: "center",
    color: "var(--color-text-muted)",
    fontSize: 14,
  },
  badge: (color) => ({
    fontSize: 12,
    fontWeight: 500,
    padding: "3px 10px",
    borderRadius: 10,
    display: "inline-block",
    ...color,
  }),

  // Comando interpretado
  comandoBox: {
    padding: "12px 16px",
    background: "#E1F5EE",
    border: "1px solid #5DCAA5",
    borderRadius: "var(--radius-sm)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  comandoTexto: { fontSize: 14, color: "#0F6E56", fontWeight: 500 },
  comandoBtnLimpiar: {
    padding: "4px 10px",
    background: "none",
    border: "1px solid #5DCAA5",
    borderRadius: "var(--radius-sm)",
    fontSize: 12,
    color: "#0F6E56",
    cursor: "pointer",
  },
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function ReportesPage() {
  const [tabActivo, setTabActivo] = useState("manual"); // "manual" | "voz"

  // Estado del reporte
  const [moduloActivo, setModuloActivo] = useState("asistencia");
  const [columnasSeleccionadas, setColumnasSeleccionadas] = useState(
    MODULOS.asistencia.columnas.map((c) => c.key),
  );
  const [filtros, setFiltros] = useState({
    fecha_desde: "",
    fecha_hasta: "",
    estado: "",
    tipo: "",
    activo: "",
  });
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [generado, setGenerado] = useState(false);

  // Comando de voz aplicado
  const [comandoVoz, setComandoVoz] = useState(null);

  const modulo = MODULOS[moduloActivo];

  // ── Cambiar módulo ──────────────────────────────────────────────────────
  const handleCambiarModulo = (key) => {
    setModuloActivo(key);
    setColumnasSeleccionadas(MODULOS[key].columnas.map((c) => c.key));
    setDatos([]);
    setGenerado(false);
    setMsg(null);
    setFiltros({
      fecha_desde: "",
      fecha_hasta: "",
      estado: "",
      tipo: "",
      activo: "",
    });
  };

  const toggleColumna = (key) => {
    setColumnasSeleccionadas((prev) =>
      prev.includes(key)
        ? prev.length > 1
          ? prev.filter((k) => k !== key)
          : prev
        : [...prev, key],
    );
  };

  const handleFiltro = (key, val) =>
    setFiltros((prev) => ({ ...prev, [key]: val }));

  // ── Comando de voz recibido ─────────────────────────────────────────────
  const handleComandoVoz = (resultado) => {
    // Cambiar al tab manual para mostrar el reporte configurado
    setTabActivo("manual");
    setComandoVoz(resultado);

    // Aplicar módulo
    const moduloDetectado = resultado.modulo;
    if (moduloDetectado && MODULOS[moduloDetectado]) {
      setModuloActivo(moduloDetectado);
      setColumnasSeleccionadas(
        resultado.columnas ||
          MODULOS[moduloDetectado].columnas.map((c) => c.key),
      );
    }

    // Aplicar filtros
    const f = resultado.filtros || {};
    setFiltros({
      fecha_desde: f.fecha_desde || "",
      fecha_hasta: f.fecha_hasta || "",
      estado: f.estado || "",
      tipo: f.tipo || "",
      activo: f.activo || "",
    });

    setDatos([]);
    setGenerado(false);
    setMsg(null);

    // Auto-generar el reporte
    setTimeout(
      () => generarReporte(moduloDetectado, f, resultado.columnas),
      300,
    );

    // Si pidió exportar, lo hacemos después de generar
    if (resultado.exportar) {
      setTimeout(() => {
        if (resultado.exportar === "pdf") exportarPDF();
        if (resultado.exportar === "excel") exportarExcel();
      }, 2000);
    }
  };

  const limpiarComandoVoz = () => {
    setComandoVoz(null);
    handleCambiarModulo(moduloActivo);
  };

  // ── Generar reporte ─────────────────────────────────────────────────────
  const generarReporte = async (moduloKey, filtrosExtra, columnasExtra) => {
    const moduloFinal = moduloKey || moduloActivo;
    const filtrosFinal = filtrosExtra || filtros;

    setLoading(true);
    setMsg(null);
    setDatos([]);

    try {
      const params = {};
      if (filtrosFinal.fecha_desde) params.desde = filtrosFinal.fecha_desde;
      if (filtrosFinal.fecha_hasta) params.hasta = filtrosFinal.fecha_hasta;
      if (filtrosFinal.estado) params.estado = filtrosFinal.estado;
      if (filtrosFinal.tipo) params.tipo = filtrosFinal.tipo;
      if (filtrosFinal.activo !== "") params.activo = filtrosFinal.activo;

      const { data } = await api.get(MODULOS[moduloFinal].endpoint, { params });
      const lista = data.results ?? data;

      if (!lista.length) {
        setMsg({
          tipo: "err",
          texto: "No se encontraron datos con los filtros aplicados.",
        });
        setGenerado(false);
        return;
      }

      setDatos(lista);
      setGenerado(true);

      if (columnasExtra) setColumnasSeleccionadas(columnasExtra);
    } catch {
      setMsg({
        tipo: "err",
        texto: "Error al obtener los datos. Verificá los filtros.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Columnas activas ────────────────────────────────────────────────────
  const columnasActivas = modulo.columnas.filter((c) =>
    columnasSeleccionadas.includes(c.key),
  );

  // ── Exportar PDF ────────────────────────────────────────────────────────
  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text(`Reporte de ${modulo.label}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString("es-BO")}`, 14, 23);
    if (comandoVoz?.texto_original) {
      doc.text(`Comando de voz: "${comandoVoz.texto_original}"`, 14, 29);
    }

    autoTable(doc, {
      startY: comandoVoz ? 34 : 28,
      head: [columnasActivas.map((c) => c.label)],
      body: datos.map((row) =>
        columnasActivas.map((c) => formatearValor(c.key, row[c.key])),
      ),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: {
        fillColor: [29, 158, 117],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(
      `reporte_${moduloActivo}_${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  // ── Exportar Excel ──────────────────────────────────────────────────────
  const exportarExcel = () => {
    const filas = datos.map((row) => {
      const fila = {};
      columnasActivas.forEach((c) => {
        fila[c.label] = formatearValor(c.key, row[c.key]);
      });
      return fila;
    });

    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, modulo.label);
    XLSX.writeFile(
      wb,
      `reporte_${moduloActivo}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={s.pageTitle}>Reportes</h1>
      </div>

      {/* Tabs Manual / Voz */}
      <div style={s.tabs}>
        <button
          style={s.tab(tabActivo === "manual")}
          onClick={() => setTabActivo("manual")}
        >
          📊 Reporte manual
        </button>
        <button
          style={s.tab(tabActivo === "voz")}
          onClick={() => setTabActivo("voz")}
        >
          🎙️ Reporte por voz
        </button>
      </div>

      {/* ── TAB VOZ ── */}
      {tabActivo === "voz" && (
        <PanelVoz onComandoInterpretado={handleComandoVoz} />
      )}

      {/* ── TAB MANUAL ── */}
      {tabActivo === "manual" && (
        <>
          {/* Banner si vino de un comando de voz */}
          {comandoVoz && (
            <div style={s.comandoBox}>
              <div>
                <span
                  style={{ fontSize: 12, color: "#1D9E75", fontWeight: 600 }}
                >
                  🎙️ COMANDO DE VOZ APLICADO
                </span>
                <div style={s.comandoTexto}>
                  "{comandoVoz.texto_original}" → {comandoVoz.descripcion}
                </div>
              </div>
              <button style={s.comandoBtnLimpiar} onClick={limpiarComandoVoz}>
                ✕ Limpiar
              </button>
            </div>
          )}

          {msg && (
            <div style={msg.tipo === "ok" ? s.msgOk : s.msgErr}>
              {msg.texto}
            </div>
          )}

          {/* 1. Módulo */}
          <div style={s.card}>
            <div style={s.cardTitle}>1. Seleccioná el módulo</div>
            <div style={s.modulosGrid}>
              {Object.entries(MODULOS).map(([key, m]) => (
                <button
                  key={key}
                  style={s.moduloBtn(moduloActivo === key)}
                  onClick={() => handleCambiarModulo(key)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Filtros */}
          <div style={s.card}>
            <div style={s.cardTitle}>2. Aplicá filtros</div>
            <div style={s.grid3}>
              {modulo.filtros.includes("fecha_desde") && (
                <div style={s.field}>
                  <label style={s.label}>Fecha desde</label>
                  <input
                    type="date"
                    value={filtros.fecha_desde}
                    onChange={(e) =>
                      handleFiltro("fecha_desde", e.target.value)
                    }
                    style={s.input}
                  />
                </div>
              )}
              {modulo.filtros.includes("fecha_hasta") && (
                <div style={s.field}>
                  <label style={s.label}>Fecha hasta</label>
                  <input
                    type="date"
                    value={filtros.fecha_hasta}
                    onChange={(e) =>
                      handleFiltro("fecha_hasta", e.target.value)
                    }
                    style={s.input}
                  />
                </div>
              )}
              {modulo.filtros.includes("estado") &&
                moduloActivo === "asistencia" && (
                  <div style={s.field}>
                    <label style={s.label}>Estado</label>
                    <select
                      value={filtros.estado}
                      onChange={(e) => handleFiltro("estado", e.target.value)}
                      style={s.select}
                    >
                      <option value="">Todos</option>
                      {ESTADOS_ASISTENCIA.map((e) => (
                        <option key={e} value={e}>
                          {e.charAt(0).toUpperCase() + e.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              {modulo.filtros.includes("estado") &&
                moduloActivo === "pagos" && (
                  <div style={s.field}>
                    <label style={s.label}>Estado</label>
                    <select
                      value={filtros.estado}
                      onChange={(e) => handleFiltro("estado", e.target.value)}
                      style={s.select}
                    >
                      <option value="">Todos</option>
                      {ESTADOS_PAGO.map((e) => (
                        <option key={e} value={e}>
                          {e.charAt(0).toUpperCase() + e.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              {modulo.filtros.includes("tipo") && (
                <div style={s.field}>
                  <label style={s.label}>Tipo de actividad</label>
                  <select
                    value={filtros.tipo}
                    onChange={(e) => handleFiltro("tipo", e.target.value)}
                    style={s.select}
                  >
                    <option value="">Todos</option>
                    {TIPOS_ACTIVIDAD.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {modulo.filtros.includes("activo") && (
                <div style={s.field}>
                  <label style={s.label}>Estado del niño</label>
                  <select
                    value={filtros.activo}
                    onChange={(e) => handleFiltro("activo", e.target.value)}
                    style={s.select}
                  >
                    <option value="">Todos</option>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 3. Columnas */}
          <div style={s.card}>
            <div style={s.cardTitle}>3. Elegí las columnas</div>
            <div style={s.columnasGrid}>
              {modulo.columnas.map((c) => (
                <button
                  key={c.key}
                  style={s.columnaChip(columnasSeleccionadas.includes(c.key))}
                  onClick={() => toggleColumna(c.key)}
                >
                  {columnasSeleccionadas.includes(c.key) ? "✓ " : ""}
                  {c.label}
                </button>
              ))}
            </div>
            <p
              style={{
                fontSize: 12,
                color: "var(--color-text-muted)",
                marginTop: -8,
              }}
            >
              {columnasSeleccionadas.length} columna
              {columnasSeleccionadas.length !== 1 ? "s" : ""} seleccionada
              {columnasSeleccionadas.length !== 1 ? "s" : ""}.
            </p>
          </div>

          {/* 4. Generar */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              style={{ ...s.btnPrimary, opacity: loading ? 0.6 : 1 }}
              onClick={() => generarReporte()}
              disabled={loading}
            >
              {loading ? "Generando..." : "Generar reporte"}
            </button>
            {generado && (
              <>
                <button style={s.btnDanger} onClick={exportarPDF}>
                  {" "}
                  ↓ Exportar PDF{" "}
                </button>
                <button style={s.btnSuccess} onClick={exportarExcel}>
                  {" "}
                  ↓ Exportar Excel{" "}
                </button>
              </>
            )}
          </div>

          {/* 5. Tabla */}
          {generado && datos.length > 0 && (
            <>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                {datos.length} resultado{datos.length !== 1 ? "s" : ""}{" "}
                encontrado{datos.length !== 1 ? "s" : ""}
              </p>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {columnasActivas.map((c) => (
                        <th key={c.key} style={s.th}>
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {datos.map((row, i) => (
                      <tr
                        key={i}
                        style={{
                          background:
                            i % 2 === 0
                              ? "var(--color-surface)"
                              : "var(--color-bg)",
                        }}
                      >
                        {columnasActivas.map((c) => {
                          const color = colorEstado(c.key, row[c.key]);
                          return (
                            <td key={c.key} style={s.td}>
                              {color ? (
                                <span style={s.badge(color)}>
                                  {formatearValor(c.key, row[c.key])}
                                </span>
                              ) : (
                                formatearValor(c.key, row[c.key])
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!generado && !loading && (
            <div style={s.empty}>
              {comandoVoz
                ? "Procesando tu comando de voz..."
                : 'Configurá el módulo, los filtros y las columnas, luego presioná "Generar reporte". También podés usar el reporte por voz 🎙️'}
            </div>
          )}
        </>
      )}
    </div>
  );
}