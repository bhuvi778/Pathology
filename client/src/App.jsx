import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageDoctors from './pages/admin/ManageDoctors';
import ManageTests from './pages/admin/ManageTests';
import ManageUsers from './pages/admin/ManageUsers';
import AllPatients from './pages/admin/AllPatients';
import AllReports from './pages/admin/AllReports';
import AllBills from './pages/admin/AllBills';
import LabSettings from './pages/admin/LabSettings';
import FillReportReading from './pages/admin/FillReportReading';
import ReceptionDashboard from './pages/receptionist/ReceptionDashboard';
import RegisterPatient from './pages/receptionist/RegisterPatient';
import Appointments from './pages/receptionist/Appointments';
import NewAppointment from './pages/receptionist/NewAppointment';
import Billing from './pages/receptionist/Billing';
import ViewReportsReception from './pages/receptionist/ViewReports';
import PatientWorkflow from './pages/receptionist/PatientWorkflow';
import SampleCollection from './pages/receptionist/SampleCollection';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientQueue from './pages/doctor/PatientQueue';
import EnterResults from './pages/doctor/EnterResults';
import ViewReports from './pages/doctor/ViewReports';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const RoleHome = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'receptionist') return <Navigate to="/reception" replace />;
  if (user?.role === 'doctor') return <Navigate to="/doctor" replace />;
  return <Navigate to="/login" replace />;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <RoleHome /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<RoleHome />} />
        {/* Admin Routes */}
        <Route path="admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="admin/doctors" element={<ProtectedRoute roles={['admin']}><ManageDoctors /></ProtectedRoute>} />
        <Route path="admin/tests" element={<ProtectedRoute roles={['admin']}><ManageTests /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute roles={['admin']}><ManageUsers /></ProtectedRoute>} />
        <Route path="admin/patients" element={<ProtectedRoute roles={['admin']}><AllPatients /></ProtectedRoute>} />
        <Route path="admin/reports" element={<ProtectedRoute roles={['admin']}><AllReports /></ProtectedRoute>} />
        <Route path="admin/fill-report/:appointmentId" element={<ProtectedRoute roles={['admin']}><FillReportReading /></ProtectedRoute>} />
        <Route path="admin/bills" element={<ProtectedRoute roles={['admin']}><AllBills /></ProtectedRoute>} />
        <Route path="admin/settings" element={<ProtectedRoute roles={['admin']}><LabSettings /></ProtectedRoute>} />
        {/* Receptionist Routes */}
        <Route path="reception" element={<ProtectedRoute roles={['admin', 'receptionist']}><ReceptionDashboard /></ProtectedRoute>} />
        <Route path="reception/patients" element={<ProtectedRoute roles={['admin', 'receptionist']}><AllPatients /></ProtectedRoute>} />
        <Route path="reception/register" element={<ProtectedRoute roles={['admin', 'receptionist']}><RegisterPatient /></ProtectedRoute>} />
        <Route path="reception/appointments" element={<ProtectedRoute roles={['admin', 'receptionist']}><Appointments /></ProtectedRoute>} />
        <Route path="reception/new-appointment" element={<ProtectedRoute roles={['admin', 'receptionist']}><NewAppointment /></ProtectedRoute>} />
        <Route path="reception/sample-collection" element={<ProtectedRoute roles={['admin', 'receptionist']}><SampleCollection /></ProtectedRoute>} />
        <Route path="reception/workflow" element={<ProtectedRoute roles={['admin', 'receptionist']}><PatientWorkflow /></ProtectedRoute>} />
        <Route path="reception/view-reports" element={<ProtectedRoute roles={['admin', 'receptionist']}><ViewReportsReception /></ProtectedRoute>} />
        <Route path="reception/billing" element={<ProtectedRoute roles={['admin', 'receptionist']}><Billing /></ProtectedRoute>} />
        {/* Doctor Routes */}
        <Route path="doctor" element={<ProtectedRoute roles={['admin', 'doctor']}><DoctorDashboard /></ProtectedRoute>} />
        <Route path="doctor/queue" element={<ProtectedRoute roles={['admin', 'doctor']}><PatientQueue /></ProtectedRoute>} />
        <Route path="doctor/results/:appointmentId" element={<ProtectedRoute roles={['admin', 'doctor']}><EnterResults /></ProtectedRoute>} />
        <Route path="doctor/reports" element={<ProtectedRoute roles={['admin', 'doctor']}><ViewReports /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
