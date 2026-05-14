import { useState, useRef } from "react";
import api from "../../api/axiosConfig";
import Swal from "sweetalert2";

const s = {
  page: { display: "flex", flexDirection: "column", gap: 24 },
  pageTitle: { fontSize: 22, fontWeight: 600, color: "var(--color-text)" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  card: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: 600, color: "var(--color-text)" },
  cardDesc: { fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.6 },
  btnPrimary: {
    padding: "11px 22px", background: "var(--color-primary)",
    color: "#fff", border: "none", borderRadius: "var(--radius-sm)",
    fontSize: 14, fontWeight: 500, cursor: "pointer", alignSelf: "flex-start",
  },
  btnDanger: {
    padding: "11px 22px", background: "#E24B4A",
    color: "#fff", border: "none", borderRadius: "var(--radius-sm)",
    fontSize: 14, fontWeight: 500, cursor: "pointer", alignSelf: "flex-start",
  },
  infoBanner: {
    padding: "12px 16px",
    background: "#E6F1FB",
    border: "1px solid #85B7EB",
    borderRadius: "var(--radius-sm)",
    fontSize: 13, color: "#185FA5", lineHeight: 1.6,
  },
  warningBanner: {
    padding: "12px 16px",
    background: "#FAEEDA",
    border: "1px solid #FAC775",
    borderRadius: "var(--radius-sm)",
    fontSize: 13, color: "#854F0B", lineHeight: 1.6,
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
  uploadZone: (dragging) => ({
    border: `2px dashed ${dragging ? "var(--color-primary)" : "var(--color-border)"}`,
    borderRadius: "var(--radius-md)",
    padding: 32,
    textAlign: "center",
    background: dragging ? "#E1F5EE" : "var(--color-bg)",
    cursor: "pointer",
    transition: "all .15s",
  }),
  uploadIcon: { fontSize: 36, marginBottom: 8 },
  uploadText: { fontSize: 14, color: "var(--color-text-muted)", marginBottom: 4 },
  uploadHint: { fontSize: 12, color: "var(--color-text-muted)" },
  archivoSeleccionado: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 16px",
    background: "#E1F5EE",
    border: "1px solid #5DCAA5",
    borderRadius: "var(--radius-sm)",
  },
  archivoNombre: { fontSize: 14, fontWeight: 500, color: "#0F6E56", flex: 1 },
  archivoSize: { fontSize: 12, color: "#1D9E75" },
  btnQuitar: {
    background: "none", border: "none",
    color: "#A32D2D", cursor: "pointer", fontSize: 16,
  },
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function BackupPage() {
  const [descargando, setDescargando]   = useState(false);
  const [restaurando, setRestaurando]   = useState(false);
  const [archivo, setArchivo]           = useState(null);
  const [dragging, setDragging]         = useState(false);
  const [msg, setMsg]                   = useState(null);
  const inputRef                        = useRef();

  const mostrarMsg = (tipo, texto) => {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg(null), 4000);
  };

  // ── Descargar backup ───────────────────────────────────────────
  const handleDescargar = async () => {
    setDescargando(true);
    try {
      const response = await api.get("/backup/descargar/", {
        responseType: "blob",
      });

      // Obtener nombre del archivo desde el header
      const disposition = response.headers["content-disposition"];
      const nombre = disposition
        ? disposition.split('filename="')[1]?.replace('"', "")
        : `backup_guarderia_${new Date().toISOString().split("T")[0]}.sql.gz`;

      // Crear link de descarga y clickearlo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", nombre);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      mostrarMsg("ok", `Backup descargado: ${nombre}`);
    } catch {
      mostrarMsg("err", "Error al generar el backup.");
    } finally {
      setDescargando(false);
    }
  };

  // ── Manejo de archivo ──────────────────────────────────────────
  const handleArchivo = (file) => {
    if (!file) return;
    if (!file.name.endsWith(".sql.gz") && !file.name.endsWith(".sql")) {
      mostrarMsg("err", "El archivo debe ser .sql.gz o .sql");
      return;
    }
    setArchivo(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleArchivo(file);
  };

  // ── Restaurar backup ───────────────────────────────────────────
  const handleRestaurar = async () => {
    if (!archivo) return;

    const confirm = await Swal.fire({
      icon: "warning",
      title: "¿Restaurar base de datos?",
      html: `
        <p>Se restaurará desde:</p>
        <p><strong>${archivo.name}</strong></p>
        <p style="color:#E24B4A; margin-top: 12px;">
          ⚠️ Esta acción reemplazará TODOS los datos actuales.<br/>
          Esta operación no se puede deshacer.
        </p>
      `,
      showCancelButton: true,
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#E24B4A",
      cancelButtonColor: "#64748b",
    });

    if (!confirm.isConfirmed) return;

    setRestaurando(true);
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);

      await api.post("/backup/restaurar/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await Swal.fire({
        icon: "success",
        title: "Restauración exitosa",
        text: "La base de datos fue restaurada correctamente. Recargá la página.",
        confirmButtonColor: "#1D9E75",
      });

      setArchivo(null);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error al restaurar",
        text: err.response?.data?.detail ?? "No se pudo restaurar el backup.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setRestaurando(false);
    }
  };

  return (
    <div style={s.page}>
      <h1 style={s.pageTitle}>Backup y restauración</h1>

      {msg && (
        <div style={msg.tipo === "ok" ? s.msgOk : s.msgErr}>
          {msg.texto}
        </div>
      )}

      <div style={s.infoBanner}>
        ℹ️ El backup descarga un archivo <strong>.sql.gz</strong> comprimido directamente a tu computadora. Para restaurar, subí ese mismo archivo.
      </div>

      <div style={s.grid2}>

        {/* ── Backup ── */}
        <div style={s.card}>
          <div style={s.cardTitle}>⬇ Crear backup</div>
          <div style={s.cardDesc}>
            Generá un backup completo de la base de datos. El archivo se descargará automáticamente a tu computadora en formato <strong>.sql.gz</strong>.
          </div>
          <div style={s.cardDesc}>
            Guardá este archivo en un lugar seguro. Lo vas a necesitar si querés restaurar la base de datos.
          </div>
          <button
            style={{ ...s.btnPrimary, opacity: descargando ? 0.6 : 1 }}
            onClick={handleDescargar}
            disabled={descargando}
          >
            {descargando ? "Generando..." : "⬇ Descargar backup"}
          </button>
        </div>

        {/* ── Restaurar ── */}
        <div style={s.card}>
          <div style={s.cardTitle}>⬆ Restaurar backup</div>

          <div style={s.warningBanner}>
            ⚠️ La restauración reemplaza todos los datos actuales. Asegurate de tener un backup reciente antes de continuar.
          </div>

          {/* Zona de upload */}
          {!archivo ? (
            <div
              style={s.uploadZone(dragging)}
              onClick={() => inputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div style={s.uploadIcon}>📂</div>
              <div style={s.uploadText}>
                Arrastrá el archivo acá o hacé click para seleccionar
              </div>
              <div style={s.uploadHint}>Formatos aceptados: .sql.gz, .sql</div>
              <input
                ref={inputRef}
                type="file"
                accept=".sql,.gz,.sql.gz"
                style={{ display: "none" }}
                onChange={(e) => handleArchivo(e.target.files[0])}
              />
            </div>
          ) : (
            <div style={s.archivoSeleccionado}>
              <span style={{ fontSize: 20 }}>📄</span>
              <div style={{ flex: 1 }}>
                <div style={s.archivoNombre}>{archivo.name}</div>
                <div style={s.archivoSize}>{formatBytes(archivo.size)}</div>
              </div>
              <button
                style={s.btnQuitar}
                onClick={() => setArchivo(null)}
                title="Quitar archivo"
              >
                ✕
              </button>
            </div>
          )}

          <button
            style={{
              ...s.btnDanger,
              opacity: (restaurando || !archivo) ? 0.6 : 1,
            }}
            onClick={handleRestaurar}
            disabled={restaurando || !archivo}
          >
            {restaurando ? "Restaurando..." : "⬆ Restaurar base de datos"}
          </button>
        </div>

      </div>
    </div>
  );
}