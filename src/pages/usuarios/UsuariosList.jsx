import { useEffect, useState, useCallback } from "react";
import {
  getUsuarios,
  crearUsuario,
  editarUsuario,
  eliminarUsuario,
  activarUsuario,
  cambiarPassword,
  getRoles,
  crearRol,
  editarRol,
  eliminarRol,
} from "../../api/usuariosApi";
import styles from "./Usuarios.module.css";

const FORM_INICIAL = {
  nombre: "",
  email: "",
  password: "",
  id_rol: "",
  activo: true,
};

const PWD_INICIAL = {
  password_actual: "",
  password_nueva: "",
  password_confirmacion: "",
};

function rolClass(nombre) {
  if (!nombre) return styles.rolDefault;
  if (nombre === "Administrador") return styles.rolAdmin;
  if (nombre === "Personal") return styles.rolPersonal;
  if (nombre === "Tutor") return styles.rolTutor;
  return styles.rolDefault;
}

export default function UsuariosList() {
  const [tab, setTab] = useState("usuarios");
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [msg, setMsg] = useState(null);

  // Modal usuario
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [modalMsg, setModalMsg] = useState(null);

  // Modal cambiar password
  const [modalPwd, setModalPwd] = useState(false);
  const [usuarioPwd, setUsuarioPwd] = useState(null);
  const [pwd, setPwd] = useState(PWD_INICIAL);
  const [guardandoPwd, setGuardandoPwd] = useState(false);

  // Modal rol
  const [modalRol, setModalRol] = useState(false);
  const [editandoRol, setEditandoRol] = useState(null);
  const [formRol, setFormRol] = useState({ nombre: "" });
  const [guardandoRol, setGuardandoRol] = useState(false);

  const cargarDatos = useCallback(() => {
    setLoading(true);
    Promise.all([getUsuarios(), getRoles()])
      .then(([u, r]) => {
        setUsuarios(u.data.results ?? u.data);
        setRoles(r.data.results ?? r.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const mostrarMsg = (tipo, texto, global = true) => {
    if (global) {
      setMsg({ tipo, texto });
      setTimeout(() => setMsg(null), 3500);
    } else {
      setModalMsg({ tipo, texto });
    }
  };

  // ── Filtros ──────────────────────────────────────────────────
  const usuariosFiltrados = usuarios.filter((u) => {
    const matchBusq =
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase());
    const matchRol = filtroRol ? String(u.id_rol) === filtroRol : true;
    return matchBusq && matchRol;
  });

  // ── CRUD Usuarios ─────────────────────────────────────────────
  const abrirCrear = () => {
    setEditando(null);
    setForm({ ...FORM_INICIAL, id_rol: roles[0]?.id_rol ?? "" });
    setModalMsg(null);
    setModal(true);
  };

  const abrirEditar = (u) => {
    setEditando(u);
    setForm({
      nombre: u.nombre,
      email: u.email,
      password: "",
      id_rol: u.id_rol,
      activo: u.activo,
    });
    setModalMsg(null);
    setModal(true);
  };

  const cerrarModal = () => {
    setModal(false);
    setEditando(null);
    setModalMsg(null);
  };

  const handleChange = (e) => {
    const val =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: val }));
  };

  const handleGuardar = async () => {
    if (!form.nombre || !form.email || !form.id_rol) {
      setModalMsg({
        tipo: "err",
        texto: "Nombre, email y rol son obligatorios.",
      });
      return;
    }
    if (!editando && !form.password) {
      setModalMsg({
        tipo: "err",
        texto: "La contraseña es obligatoria al crear.",
      });
      return;
    }
    setGuardando(true);
    setModalMsg(null);
    try {
      const payload = {
        nombre: form.nombre,
        email: form.email,
        id_rol: form.id_rol,
        activo: form.activo,
      };
      if (form.password) payload.password = form.password;

      if (editando) {
        await editarUsuario(editando.id_usuario, payload);
        mostrarMsg("ok", "Usuario actualizado correctamente.");
      } else {
        await crearUsuario({ ...payload, password: form.password });
        mostrarMsg("ok", "Usuario creado correctamente.");
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

  const handleEliminar = async (u) => {
    if (!confirm(`¿Eliminar PERMANENTEMENTE al usuario "${u.nombre}"?`)) return;

    try {
      await eliminarUsuario(u.id_usuario);

      mostrarMsg("ok", "Usuario eliminado correctamente.");
      cargarDatos();
    } catch (error) {
      console.error(error);
      mostrarMsg("err", "No se pudo eliminar el usuario.");
    }
  };

  const handleActivar = async (u) => {
    try {
      await activarUsuario(u.id_usuario);
      mostrarMsg("ok", `Usuario "${u.nombre}" reactivado.`);
      cargarDatos();
    } catch {
      mostrarMsg("err", "No se pudo activar el usuario.");
    }
  };

  // ── Cambiar password ──────────────────────────────────────────
  const abrirCambiarPwd = (u) => {
    setUsuarioPwd(u);
    setPwd(PWD_INICIAL);
    setModalPwd(true);
  };

  const handleCambiarPwd = async () => {
    if (!pwd.password_nueva || !pwd.password_confirmacion) {
      mostrarMsg("err", "Completá todos los campos.", false);
      return;
    }
    if (pwd.password_nueva !== pwd.password_confirmacion) {
      mostrarMsg("err", "Las contraseñas no coinciden.", false);
      return;
    }
    setGuardandoPwd(true);
    try {
      await cambiarPassword(usuarioPwd.id_usuario, pwd);
      mostrarMsg("ok", "Contraseña actualizada.");
      setModalPwd(false);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data ?? {})[0]?.[0] ||
        "Error al cambiar contraseña.";
      mostrarMsg("err", detail, false);
    } finally {
      setGuardandoPwd(false);
    }
  };

  // ── CRUD Roles ────────────────────────────────────────────────
  const abrirCrearRol = () => {
    setEditandoRol(null);
    setFormRol({ nombre: "" });
    setModalRol(true);
  };

  const abrirEditarRol = (r) => {
    setEditandoRol(r);
    setFormRol({ nombre: r.nombre });
    setModalRol(true);
  };

  const handleGuardarRol = async () => {
    if (!formRol.nombre.trim()) return;
    setGuardandoRol(true);
    try {
      if (editandoRol) {
        await editarRol(editandoRol.id_rol, formRol);
        mostrarMsg("ok", "Rol actualizado.");
      } else {
        await crearRol(formRol);
        mostrarMsg("ok", "Rol creado.");
      }
      cargarDatos();
      setModalRol(false);
    } catch (err) {
      mostrarMsg(
        "err",
        err.response?.data?.detail ?? "Error al guardar el rol.",
      );
    } finally {
      setGuardandoRol(false);
    }
  };

  const handleEliminarRol = async (r) => {
    if (!confirm(`¿Eliminar el rol "${r.nombre}"?`)) return;
    try {
      await eliminarRol(r.id_rol);
      mostrarMsg("ok", "Rol eliminado.");
      cargarDatos();
    } catch {
      mostrarMsg("err", "No se pudo eliminar el rol. Puede estar en uso.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Usuarios y acceso</h1>
        {tab === "usuarios" && (
          <button className={styles.btnPrimary} onClick={abrirCrear}>
            + Nuevo usuario
          </button>
        )}
        {tab === "roles" && (
          <button className={styles.btnPrimary} onClick={abrirCrearRol}>
            + Nuevo rol
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
        <button
          className={`${styles.tab} ${tab === "usuarios" ? styles.active : ""}`}
          onClick={() => setTab("usuarios")}
        >
          Usuarios
        </button>
        <button
          className={`${styles.tab} ${tab === "roles" ? styles.active : ""}`}
          onClick={() => setTab("roles")}
        >
          Roles
        </button>
      </div>

      {/* ── TAB USUARIOS ── */}
      {tab === "usuarios" && (
        <>
          <div className={styles.filters}>
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={styles.searchInput}
            />
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className={styles.select}
            >
              <option value="">Todos los roles</option>
              {roles.map((r) => (
                <option key={r.id_rol} value={String(r.id_rol)}>
                  {r.nombre}
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
              {usuariosFiltrados.length} resultado
              {usuariosFiltrados.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} className={styles.empty}>
                      Cargando...
                    </td>
                  </tr>
                )}
                {!loading && !usuariosFiltrados.length && (
                  <tr>
                    <td colSpan={4} className={styles.empty}>
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id_usuario}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatar}>
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.userName}>{u.nombre}</div>
                          <div className={styles.userEmail}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.rolBadge} ${rolClass(u.rol_nombre)}`}
                      >
                        {u.rol_nombre ?? "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          padding: "3px 8px",
                          borderRadius: 10,
                          background: u.activo ? "#EAF3DE" : "#FCEBEB",
                          color: u.activo ? "#3B6D11" : "#A32D2D",
                        }}
                      >
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.btnIcon}
                          onClick={() => abrirEditar(u)}
                        >
                          Editar
                        </button>
                        <button
                          className={styles.btnIcon}
                          onClick={() => abrirCambiarPwd(u)}
                        >
                          Contraseña
                        </button>
                        {u.activo ? (
                          <button
                            className={styles.btnDanger}
                            onClick={() => handleEliminar(u)}
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            className={styles.btnSuccess}
                            onClick={() => handleActivar(u)}
                          >
                            Activar
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

      {/* ── TAB ROLES ── */}
      {tab === "roles" && (
        <div className={styles.rolesList}>
          {roles.map((r) => (
            <div key={r.id_rol} className={styles.roleItem}>
              <div>
                <div className={styles.roleItemName}>
                  <span className={`${styles.rolBadge} ${rolClass(r.nombre)}`}>
                    {r.nombre}
                  </span>
                </div>
              </div>
              <div className={styles.roleItemActions}>
                <button
                  className={styles.btnIcon}
                  onClick={() => abrirEditarRol(r)}
                >
                  Editar
                </button>
                <button
                  className={styles.btnDanger}
                  onClick={() => handleEliminarRol(r)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          {!roles.length && (
            <p
              style={{
                fontSize: 14,
                color: "var(--color-text-muted)",
                padding: 16,
              }}
            >
              No hay roles registrados.
            </p>
          )}
        </div>
      )}

      {/* ── MODAL CREAR / EDITAR USUARIO ── */}
      {modal && (
        <div className={styles.overlay} onClick={cerrarModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {editando ? "Editar usuario" : "Nuevo usuario"}
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
                  <label className={styles.label}>Nombre completo *</label>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Nombre del usuario"
                  />
                </div>

                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Email *</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Rol *</label>
                  <select
                    name="id_rol"
                    value={form.id_rol}
                    onChange={handleChange}
                    className={styles.select2}
                  >
                    <option value="">— Seleccioná un rol —</option>
                    {roles.map((r) => (
                      <option key={r.id_rol} value={r.id_rol}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={`${styles.formField} ${styles.full}`}>
                  <label
                    className={styles.label}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <input
                      type="checkbox"
                      name="activo"
                      checked={form.activo}
                      onChange={handleChange}
                    />
                    Usuario activo
                  </label>
                </div>

                <div className={styles.sectionDivider}>
                  {editando
                    ? "Nueva contraseña (dejar vacío para no cambiar)"
                    : "Contraseña *"}
                </div>

                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>
                    {editando ? "Nueva contraseña" : "Contraseña *"}
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder={
                      editando
                        ? "Dejar vacío para no cambiar"
                        : "Mínimo 8 caracteres"
                    }
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
                    : "Crear usuario"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CAMBIAR PASSWORD ── */}
      {modalPwd && (
        <div className={styles.overlay} onClick={() => setModalPwd(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                Cambiar contraseña — {usuarioPwd?.nombre}
              </span>
              <button
                className={styles.btnClose}
                onClick={() => setModalPwd(false)}
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

              <div className={styles.pwdSection}>
                <div className={styles.formField}>
                  <label className={styles.label}>Contraseña actual *</label>
                  <input
                    type="password"
                    value={pwd.password_actual}
                    onChange={(e) =>
                      setPwd((p) => ({ ...p, password_actual: e.target.value }))
                    }
                    className={styles.input}
                    placeholder="Contraseña actual"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Nueva contraseña *</label>
                  <input
                    type="password"
                    value={pwd.password_nueva}
                    onChange={(e) =>
                      setPwd((p) => ({ ...p, password_nueva: e.target.value }))
                    }
                    className={styles.input}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>
                    Confirmar nueva contraseña *
                  </label>
                  <input
                    type="password"
                    value={pwd.password_confirmacion}
                    onChange={(e) =>
                      setPwd((p) => ({
                        ...p,
                        password_confirmacion: e.target.value,
                      }))
                    }
                    className={styles.input}
                    placeholder="Repetí la nueva contraseña"
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.btnSecondary}
                onClick={() => setModalPwd(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleCambiarPwd}
                disabled={guardandoPwd}
              >
                {guardandoPwd ? "Guardando..." : "Cambiar contraseña"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CREAR / EDITAR ROL ── */}
      {modalRol && (
        <div className={styles.overlay} onClick={() => setModalRol(false)}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 360 }}
          >
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {editandoRol ? "Editar rol" : "Nuevo rol"}
              </span>
              <button
                className={styles.btnClose}
                onClick={() => setModalRol(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formField}>
                <label className={styles.label}>Nombre del rol *</label>
                <input
                  value={formRol.nombre}
                  onChange={(e) => setFormRol({ nombre: e.target.value })}
                  className={styles.input}
                  placeholder="Ej: Administrador, Personal, Tutor"
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.btnSecondary}
                onClick={() => setModalRol(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleGuardarRol}
                disabled={guardandoRol || !formRol.nombre.trim()}
              >
                {guardandoRol
                  ? "Guardando..."
                  : editandoRol
                    ? "Guardar"
                    : "Crear rol"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
