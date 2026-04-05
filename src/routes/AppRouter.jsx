import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import PrivateLayout from "../components/layout/PrivateLayout";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import NinosList from "../pages/ninos/NinosList";
import NinosForm from "../pages/ninos/NinosForm";
import TutoresList from "../pages/tutores/TutoresList";
import TutoresForm from "../pages/tutores/TutoresForm";
import AsistenciaList from "../pages/asistencia/AsistenciaList";
import AsistenciaForm from "../pages/asistencia/AsistenciaForm";
import SaludList from "../pages/salud/SaludList";
import SaludForm from "../pages/salud/SaludForm";
import ServiciosList from "../pages/servicios/ServiciosList";
import ServiciosForm from "../pages/servicios/ServiciosForm";
import PagosList from "../pages/pagos/PagosList";
import PagosForm from "../pages/pagos/PagosForm";
import PersonasAutorizadasList from "../pages/personas-autorizadas/PersonasAutorizadasList";
import UsuariosList from "../pages/usuarios/UsuariosList";

export default function AppRouter() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/login" element={<Login />} />

      {/* Privadas — todas dentro del layout */}
      <Route element={<PrivateRoute />}>
        <Route element={<PrivateLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/ninos" element={<NinosList />} />
          <Route path="/ninos/nuevo" element={<NinosForm />} />
          <Route path="/ninos/:id/editar" element={<NinosForm />} />

          <Route path="/tutores" element={<TutoresList />} />
          <Route path="/tutores/nuevo" element={<TutoresForm />} />
          <Route path="/tutores/:id/editar" element={<TutoresForm />} />

          <Route path="/asistencia" element={<AsistenciaList />} />
          <Route path="/asistencia/nuevo" element={<AsistenciaForm />} />

          <Route path="/salud" element={<SaludList />} />
          <Route path="/salud/nuevo" element={<SaludForm />} />
          <Route path="/salud/:id/editar" element={<SaludForm />} />

          <Route path="/servicios" element={<ServiciosList />} />
          <Route path="/servicios/nuevo" element={<ServiciosForm />} />
          <Route path="/servicios/:id/editar" element={<ServiciosForm />} />

          <Route path="/usuarios" element={<UsuariosList />} />

          <Route path="/pagos" element={<PagosList />} />
          <Route path="/pagos/nuevo" element={<PagosForm />} />
          <Route
            path="/personas-autorizadas"
            element={<PersonasAutorizadasList />}
          />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
