import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import api from "../../api/axiosConfig";

// ── Configuración de módulos y sus columnas disponibles ──────────────────────
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
  "pedagogica", "recreativa", "deportiva", "artistica", "social", "otro"
];

const ESTADOS_ASISTENCIA = ["presente", "ausente", "tardanza"];
const ESTADOS_PAGO = ["pendiente", "pagado", "anulado"];

// ── Estilos inline ────────────────────────────────────────────────────────────
const s = {
  page: { display: "flex", flexDirection: "column", gap: 24 },
  pageHeader: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  pageTitle: { fontSize: 22, fontWeight: 600, color: "var(--color-text)" },

  card: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: 600, color: "var(--color-text)", marginBottom: 4 },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
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
  modulosGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 },
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
  btnSecondary: {
    padding: "10px 20px",
    background: "none",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    fontSize: 14,
    color: "var(--color-text-muted)",
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

  acciones: { display: "flex", gap: 10, flexWrap: "wrap" },

  badge: (color) => ({
    fontSize: 12,
    fontWeight: 500,
    padding: "3px 10px",
    borderRadius: 10,
    display: "inline-block",
    ...color,
  }),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatearValor(key, valor) {
  if (valor === null || valor === undefined) return "—";
  if (key === "activo") return valor ? "Activo" : "Inactivo";
  if (key === "total") return `Bs. ${parseFloat(valor).toFixed(2)}`;
  if (key === "hora_ingreso" || key === "hora_salida") {
    return valor ? valor.slice(0, 5) : "—";
  }
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

// ── Componente principal ──────────────────────────────────────────────────────
export default function ReportesPage() {
  const [moduloActivo, setModuloActivo] = useState("asistencia");
  const [columnasSeleccionadas, setColumnasSeleccionadas] = useState(
    MODULOS.asistencia.columnas.map((c) => c.key)
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

  const modulo = MODULOS[moduloActivo];

  // Al cambiar módulo, seleccionar todas las columnas por defecto
  const handleCambiarModulo = (key) => {
    setModuloActivo(key);
    setColumnasSeleccionadas(MODULOS[key].columnas.map((c) => c.key));
    setDatos([]);
    setGenerado(false);
    setMsg(null);
    setFiltros({ fecha_desde: "", fecha_hasta: "", estado: "", tipo: "", activo: "" });
  };

  const toggleColumna = (key) => {
    setColumnasSeleccionadas((prev) =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter((k) => k !== key) : prev
        : [...prev, key]
    );
  };

  const handleFiltro = (key, val) => {
    setFiltros((prev) => ({ ...prev, [key]: val }));
  };

  // ── Generar reporte ────────────────────────────────────────────────────────
  const generarReporte = async () => {
    setLoading(true);
    setMsg(null);
    setDatos([]);
    try {
      const params = {};
      if (filtros.fecha_desde) params.desde = filtros.fecha_desde;
      if (filtros.fecha_hasta) params.hasta = filtros.fecha_hasta;
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.tipo) params.tipo = filtros.tipo;
      if (filtros.activo !== "") params.activo = filtros.activo;

      const { data } = await api.get(modulo.endpoint, { params });
      const lista = data.results ?? data;

      if (!lista.length) {
        setMsg({ tipo: "err", texto: "No se encontraron datos con los filtros aplicados." });
        setGenerado(false);
        return;
      }

      setDatos(lista);
      setGenerado(true);
    } catch {
      setMsg({ tipo: "err", texto: "Error al obtener los datos. Verificá los filtros." });
    } finally {
      setLoading(false);
    }
  };

  // ── Columnas activas en orden ──────────────────────────────────────────────
  const columnasActivas = modulo.columnas.filter((c) =>
    columnasSeleccionadas.includes(c.key)
  );

  // ── Exportar PDF ──────────────────────────────────────────────────────────
  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(16);
    doc.text(`Reporte de ${modulo.label}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString("es-BO")}`, 14, 23);

    if (filtros.fecha_desde || filtros.fecha_hasta) {
      doc.text(
        `Período: ${filtros.fecha_desde || "—"} al ${filtros.fecha_hasta || "—"}`,
        14, 29
      );
    }

    autoTable(doc, {
      startY: filtros.fecha_desde || filtros.fecha_hasta ? 34 : 28,
      head: [columnasActivas.map((c) => c.label)],
      body: datos.map((row) =>
        columnasActivas.map((c) => formatearValor(c.key, row[c.key]))
      ),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: {
        fillColor: [29, 158, 117],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`reporte_${moduloActivo}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  // ── Exportar Excel ────────────────────────────────────────────────────────
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
    XLSX.writeFile(wb, `reporte_${moduloActivo}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>Reportes personalizados</h1>
      </div>

      {msg && (
        <div style={msg.tipo === "ok" ? s.msgOk : s.msgErr}>{msg.texto}</div>
      )}

      {/* 1. Selección de módulo */}
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
                onChange={(e) => handleFiltro("fecha_desde", e.target.value)}
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
                onChange={(e) => handleFiltro("fecha_hasta", e.target.value)}
                style={s.input}
              />
            </div>
          )}
          {modulo.filtros.includes("estado") && moduloActivo === "asistencia" && (
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
          {modulo.filtros.includes("estado") && moduloActivo === "pagos" && (
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

      {/* 3. Selección de columnas */}
      <div style={s.card}>
        <div style={s.cardTitle}>3. Elegí las columnas</div>
        <div style={s.columnasGrid}>
          {modulo.columnas.map((c) => (
            <button
              key={c.key}
              style={s.columnaChip(columnasSeleccionadas.includes(c.key))}
              onClick={() => toggleColumna(c.key)}
            >
              {columnasSeleccionadas.includes(c.key) ? "✓ " : ""}{c.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: -8 }}>
          {columnasSeleccionadas.length} columna{columnasSeleccionadas.length !== 1 ? "s" : ""} seleccionada{columnasSeleccionadas.length !== 1 ? "s" : ""}. Mínimo 1.
        </p>
      </div>

      {/* 4. Generar */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          style={{ ...s.btnPrimary, opacity: loading ? 0.6 : 1 }}
          onClick={generarReporte}
          disabled={loading}
        >
          {loading ? "Generando..." : "Generar reporte"}
        </button>
        {generado && (
          <>
            <button style={s.btnDanger} onClick={exportarPDF}>
              ↓ Exportar PDF
            </button>
            <button style={s.btnSuccess} onClick={exportarExcel}>
              ↓ Exportar Excel
            </button>
          </>
        )}
      </div>

      {/* 5. Tabla resultado */}
      {generado && datos.length > 0 && (
        <>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            {datos.length} resultado{datos.length !== 1 ? "s" : ""} encontrado{datos.length !== 1 ? "s" : ""}
          </p>

          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {columnasActivas.map((c) => (
                    <th key={c.key} style={s.th}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datos.map((row, i) => (
                  <tr
                    key={i}
                    style={{ background: i % 2 === 0 ? "var(--color-surface)" : "var(--color-bg)" }}
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
          Configurá el módulo, los filtros y las columnas, luego presioná "Generar reporte".
        </div>
      )}
    </div>
  );
}