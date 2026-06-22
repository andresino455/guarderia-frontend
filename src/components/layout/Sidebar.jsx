import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: "▦",
    roles: ["Administrador", "Personal", "Tutor"],
  },
  {
    to: "/ninos",
    label: "Niños",
    icon: "◉",
    roles: ["Administrador", "Personal"],
  },
  { to: "/tutores", label: "Tutores", icon: "◈", roles: ["Administrador"] },
  {
    to: "/salas",
    label: "Salas",
    icon: "▤",
    roles: ["Administrador", "Personal"],
  },
  {
    to: "/asistencia",
    label: "Asistencia",
    icon: "◷",
    roles: ["Administrador", "Personal"],
  },
  {
    to: "/salud",
    label: "Salud",
    icon: "♥",
    roles: ["Administrador", "Personal"],
  },
  {
    to: "/actividades",
    label: "Actividades",
    icon: "★",
    roles: ["Administrador", "Personal"],
  },
  { to: "/servicios", label: "Servicios", icon: "◆", roles: ["Administrador"] },
  {
    to: "/pagos",
    label: "Pagos",
    icon: "◎",
    roles: ["Administrador", "Tutor"],
  },
  {
    to: "/personas-autorizadas",
    label: "Pers. autorizadas",
    icon: "◈",
    roles: ["Administrador", "Personal"],
  },
  { to: "/usuarios", label: "Usuarios", icon: "◈", roles: ["Administrador"] },
  {
    to: "/retiros",
    label: "Retiros",
    icon: "🚪",
    roles: ["Administrador", "Personal"],
  },
  {
    to: "/reportes",
    label: "Reportes",
    icon: "📊",
    roles: ["Administrador", "Personal"],
  },
  { to: "/bitacora", label: "Bitácora", icon: "📋", roles: ["Administrador"] },
  { to: "/backup", label: "Backup", icon: "💾", roles: ["Administrador"] },
  {
    to: "/camaras",
    label: "Cámaras",
    icon: "📷",
    roles: ["Administrador", "Personal"],
  },
  {
    to: "/configuracion",
    label: "Configuración",
    icon: "⚙️",
    roles: ["Administrador"],
  },
];

export default function Sidebar() {
  const { usuario, guarderia, logout } = useAuth();
  const navigate = useNavigate();

  const rol = usuario?.rol_nombre;
  const itemsVisibles = NAV_ITEMS.filter((item) => item.roles.includes(rol));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className={styles.sidebar}>
      {/* Brand — muestra la guardería activa */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          {guarderia?.nombre?.charAt(0)?.toUpperCase() ?? "G"}
        </div>
        <div className={styles.brandText}>
          <span className={styles.brandName}>
            {guarderia?.nombre ?? "Guardería"}
          </span>
          <span className={styles.brandSub}>Sistema de gestión</span>
        </div>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {itemsVisibles.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ""}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer con usuario */}
      <div className={styles.footer}>
        {/* Info de guardería pequeña */}
        {guarderia && (
          <div className={styles.guarderiaTag}>🏫 {guarderia.nombre}</div>
        )}

        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {usuario?.nombre?.charAt(0)?.toUpperCase()}
          </div>
          <div className={styles.userText}>
            <span className={styles.userName}>{usuario?.nombre}</span>
            <span className={styles.userRole}>{usuario?.rol_nombre}</span>
          </div>
        </div>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
