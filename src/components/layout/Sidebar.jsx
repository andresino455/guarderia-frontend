import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import styles from "./Sidebar.module.css";

// Cada item tiene un array de roles que pueden verlo
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
  {
    to: "/usuarios",
    label: "Usuarios",
    icon: "◈",
    roles: ["Administrador"],
  },
];

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const rol = usuario?.rol_nombre;

  // Filtrar items según el rol del usuario
  const itemsVisibles = NAV_ITEMS.filter((item) => item.roles.includes(rol));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>G</div>
        <span className={styles.brandName}>Guardería</span>
      </div>

      {/* Navegación filtrada por rol */}
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

      {/* Usuario + logout al fondo */}
      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {usuario?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userText}>
            <span className={styles.userName}>{usuario?.nombre}</span>
            <span className={styles.userRole}>{usuario?.rol_nombre}</span>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Salir
        </button>
      </div>
    </aside>
  );
}
