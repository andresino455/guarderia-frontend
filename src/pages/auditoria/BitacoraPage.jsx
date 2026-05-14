import { useEffect, useState, useCallback } from "react";
import api from "../../api/axiosConfig";

const s = {
  page: { display: "flex", flexDirection: "column", gap: 24 },
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
  filters: {
    display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    padding: "14px 16px",
  },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 12, color: "var(--color-text-muted)" },
  input: {
    padding: "8px 12px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    fontSize: 14, color: "var(--color-text)",
    background: "var(--color-bg)", outline: "none", fontFamily: "inherit",
  },
  select: {
    padding: "8px 12px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    fontSize: 14, color: "var(--color-text)",
    background: "var(--color-bg)", outline: "none", fontFamily: "inherit",
  },
  btnPrimary: {
    padding: "9px 18px", background: "var(--color-primary)",
    color: "#fff", border: "none", borderRadius: "var(--radius-sm)",
    fontSize: 14, fontWeight: 500, cursor: "pointer",
  },
  btnSecondary: {
    padding: "8px 14px", background: "none",
    border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
    fontSize: 13, color: "var(--color-text-muted)", cursor: "pointer",
  },
  tableWrap: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden", overflowX: "auto",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    background: "var(--color-bg)", padding: "11px 16px", textAlign: "left",
    fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)",
    textTransform: "uppercase", letterSpacing: ".04em",
    borderBottom: "1px solid var(--color-border)", whiteSpace: "nowrap",
  },
  td: {
    padding: "11px 16px", fontSize: 14, color: "var(--color-text)",
    borderBottom: "1px solid var(--color-border)", verticalAlign: "middle",
  },
  empty: {
    padding: 40, textAlign: "center",
    color: "var(--color-text-muted)", fontSize: 14,
  },
  pagination: {
    display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end",
  },
  pageBtn: (activo) => ({
    padding: "6px 12px",
    border: `1px solid ${activo ? "var(--color-primary)" : "var(--color-border)"}`,
    borderRadius: "var(--radius-sm)",
    background: activo ? "var(--color-primary)" : "none",
    color: activo ? "#fff" : "var(--color-text-muted)",
    fontSize: 13, cursor: "pointer",
  }),
  resumenGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16,
  },
  resumenCard: (color) => ({
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    padding: 16,
    borderLeft: `4px solid ${color}`,
    display: "flex", flexDirection: "column", gap: 4,
  }),
  resumenValor: { fontSize: 28, fontWeight: 700, color: "var(--color-text)" },
  resumenLabel: { fontSize: 13, color: "var(--color-text-muted)" },
};

const ACCIONES = ["INSERT", "UPDATE", "DELETE"];
const TABLAS = [
  "nino", "tutor", "usuario", "sala", "personal",
  "asistencia", "salud", "medicacion", "alimentacion",
  "servicio", "pago", "actividad",
];

function accionBadge(accion) {
  const map = {
    INSERT: { background: "#EAF3DE", color: "#3B6D11" },
    UPDATE: { background: "#E6F1FB", color: "#185FA5" },
    DELETE: { background: "#FCEBEB", color: "#A32D2D" },
  };
  const estilo = map[accion] ?? { background: "#F1EFE8", color: "#5F5E5A" };
  return (
    <span style={{
      ...estilo,
      fontSize: 11, fontWeight: 600,
      padding: "3px 10px", borderRadius: 10,
      display: "inline-block", letterSpacing: ".03em",
    }}>
      {accion}
    </span>
  );
}

function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-BO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export default function BitacoraPage() {
  const [registros, setRegistros]     = useState([]);
  const [resumen, setResumen]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [totalRegistros, setTotal]    = useState(0);
  const [paginaActual, setPagina]     = useState(1);
  const PAGE_SIZE = 20;

  const [filtros, setFiltros] = useState({
    tabla: "", accion: "", desde: "", hasta: "",
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    tabla: "", accion: "", desde: "", hasta: "",
  });

  const cargarResumen = useCallback(async () => {
    try {
      const { data } = await api.get("/auditoria/bitacora/resumen/");
      setResumen(data);
    } catch {
      // silencioso
    }
  }, []);

  const cargarRegistros = useCallback(async (pagina = 1, filtrosActivos = filtrosAplicados) => {
    setLoading(true);
    try {
      const params = { page: pagina };
      if (filtrosActivos.tabla)  params.tabla  = filtrosActivos.tabla;
      if (filtrosActivos.accion) params.accion = filtrosActivos.accion;
      if (filtrosActivos.desde)  params.desde  = filtrosActivos.desde;
      if (filtrosActivos.hasta)  params.hasta  = filtrosActivos.hasta;

      const { data } = await api.get("/auditoria/bitacora/", { params });
      setRegistros(data.results ?? data);
      setTotal(data.count ?? (data.results ?? data).length);
    } catch {
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  }, [filtrosAplicados]);

  useEffect(() => {
    cargarResumen();
    cargarRegistros(1);
  }, []);

  const handleFiltrar = () => {
    setFiltrosAplicados({ ...filtros });
    setPagina(1);
    cargarRegistros(1, filtros);
  };

  const handleLimpiar = () => {
    const vacios = { tabla: "", accion: "", desde: "", hasta: "" };
    setFiltros(vacios);
    setFiltrosAplicados(vacios);
    setPagina(1);
    cargarRegistros(1, vacios);
  };

  const handlePagina = (p) => {
    setPagina(p);
    cargarRegistros(p);
  };

  const totalPaginas = Math.ceil(totalRegistros / PAGE_SIZE);

  return (
    <div style={s.page}>
      <h1 style={s.pageTitle}>Bitácora del sistema</h1>

      {/* Resumen */}
      {resumen && (
        <div style={s.resumenGrid}>
          <div style={s.resumenCard("#1D9E75")}>
            <span style={s.resumenValor}>{resumen.total_registros}</span>
            <span style={s.resumenLabel}>Total de eventos</span>
          </div>
          {resumen.por_accion?.map((a) => (
            <div
              key={a.accion}
              style={s.resumenCard(
                a.accion === "INSERT" ? "#1D9E75"
                : a.accion === "UPDATE" ? "#378ADD"
                : "#E24B4A"
              )}
            >
              <span style={s.resumenValor}>{a.total}</span>
              <span style={s.resumenLabel}>{a.accion}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={s.filters}>
        <div style={s.field}>
          <label style={s.label}>Tabla</label>
          <select
            value={filtros.tabla}
            onChange={(e) => setFiltros((p) => ({ ...p, tabla: e.target.value }))}
            style={s.select}
          >
            <option value="">Todas</option>
            {TABLAS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div style={s.field}>
          <label style={s.label}>Acción</label>
          <select
            value={filtros.accion}
            onChange={(e) => setFiltros((p) => ({ ...p, accion: e.target.value }))}
            style={s.select}
          >
            <option value="">Todas</option>
            {ACCIONES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div style={s.field}>
          <label style={s.label}>Desde</label>
          <input
            type="date"
            value={filtros.desde}
            onChange={(e) => setFiltros((p) => ({ ...p, desde: e.target.value }))}
            style={s.input}
          />
        </div>

        <div style={s.field}>
          <label style={s.label}>Hasta</label>
          <input
            type="date"
            value={filtros.hasta}
            onChange={(e) => setFiltros((p) => ({ ...p, hasta: e.target.value }))}
            style={s.input}
          />
        </div>

        <button style={s.btnPrimary} onClick={handleFiltrar}>
          Filtrar
        </button>
        <button style={s.btnSecondary} onClick={handleLimpiar}>
          Limpiar
        </button>
      </div>

      {/* Contador */}
      <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
        {totalRegistros} evento{totalRegistros !== 1 ? "s" : ""} encontrado{totalRegistros !== 1 ? "s" : ""}
      </div>

      {/* Tabla */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>#</th>
              <th style={s.th}>Fecha</th>
              <th style={s.th}>Usuario</th>
              <th style={s.th}>Acción</th>
              <th style={s.th}>Tabla</th>
              <th style={s.th}>ID registro</th>
              <th style={s.th}>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={s.empty}>Cargando...</td>
              </tr>
            )}
            {!loading && !registros.length && (
              <tr>
                <td colSpan={7} style={s.empty}>No hay registros.</td>
              </tr>
            )}
            {registros.map((r, i) => (
              <tr
                key={r.id_bitacora}
                style={{
                  background: i % 2 === 0
                    ? "var(--color-surface)"
                    : "var(--color-bg)",
                }}
              >
                <td style={{ ...s.td, color: "var(--color-text-muted)", fontSize: 12 }}>
                  {r.id_bitacora}
                </td>
                <td style={{ ...s.td, whiteSpace: "nowrap" }}>
                  {formatFecha(r.fecha)}
                </td>
                <td style={{ ...s.td, fontWeight: 500 }}>
                  {r.usuario_nombre ?? "Sistema"}
                </td>
                <td style={s.td}>
                  {accionBadge(r.accion)}
                </td>
                <td style={s.td}>
                  <code style={{
                    background: "var(--color-bg)",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    border: "1px solid var(--color-border)",
                  }}>
                    {r.tabla}
                  </code>
                </td>
                <td style={{ ...s.td, color: "var(--color-text-muted)" }}>
                  {r.id_registro ?? "—"}
                </td>
                <td style={{
                  ...s.td,
                  color: "var(--color-text-muted)",
                  maxWidth: 300,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {r.descripcion ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div style={s.pagination}>
          <button
            style={s.pageBtn(false)}
            onClick={() => handlePagina(paginaActual - 1)}
            disabled={paginaActual === 1}
          >
            ← Anterior
          </button>
          {Array.from({ length: Math.min(totalPaginas, 5) }, (_, i) => {
            const p = paginaActual <= 3
              ? i + 1
              : paginaActual >= totalPaginas - 2
                ? totalPaginas - 4 + i
                : paginaActual - 2 + i;
            if (p < 1 || p > totalPaginas) return null;
            return (
              <button
                key={p}
                style={s.pageBtn(p === paginaActual)}
                onClick={() => handlePagina(p)}
              >
                {p}
              </button>
            );
          })}
          <button
            style={s.pageBtn(false)}
            onClick={() => handlePagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
          >
            Siguiente →
          </button>
          <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            Página {paginaActual} de {totalPaginas}
          </span>
        </div>
      )}
    </div>
  );
}