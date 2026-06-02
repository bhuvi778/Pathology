import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, UserCog, TestTube, FileText, CreditCard,
  Calendar, UserPlus, Stethoscope, ClipboardList, Settings, X, FlaskConical,
  ChevronRight, ShieldCheck, Activity
} from 'lucide-react';

const adminNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Doctors', icon: Stethoscope, path: '/admin/doctors' },
  { label: 'Tests & Prices', icon: TestTube, path: '/admin/tests' },
  { label: 'Staff Users', icon: UserCog, path: '/admin/users' },
  { label: 'All Patients', icon: Users, path: '/admin/patients' },
  { label: 'All Reports', icon: FileText, path: '/admin/reports' },
  { label: 'All Bills', icon: CreditCard, path: '/admin/bills' },
  { label: 'Lab Settings', icon: Settings, path: '/admin/settings' },
];

const receptionNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/reception' },
  { label: 'New Patient', icon: UserPlus, path: '/reception/register' },
  { label: 'Appointments', icon: Calendar, path: '/reception/appointments' },
  { label: 'New Appointment', icon: ClipboardList, path: '/reception/new-appointment' },
  { label: 'Workflow', icon: Activity, path: '/reception/workflow' },
  { label: 'View Reports', icon: FileText, path: '/reception/view-reports' },
  { label: 'All Patients', icon: Users, path: '/reception/patients' },
  { label: 'Billing', icon: CreditCard, path: '/reception/billing' },
];

const doctorNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/doctor' },
  { label: 'Patient Queue', icon: Users, path: '/doctor/queue' },
  { label: 'Lab Reports', icon: FileText, path: '/doctor/reports' },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  const navItems =
    user?.role === 'admin' ? adminNav
    : user?.role === 'receptionist' ? receptionNav
    : doctorNav;

  const roleLabel = user?.role === 'admin' ? 'Administrator' : user?.role === 'receptionist' ? 'Receptionist' : 'Doctor';
  const roleBadgeColor = user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : user?.role === 'receptionist' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';

  return (
    <>
      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black bg-opacity-40 z-30 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl flex flex-col transform transition-transform duration-300 lg:translate-x-0 lg:static lg:shadow-none lg:border-r lg:border-slate-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800 leading-none">PathLab</p>
              <p className="text-xs text-slate-500 mt-0.5">Management System</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
              {user?.name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor}`}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">Navigation</p>
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-white/70" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center">PathLab v1.0 © 2024</p>
        </div>
      </aside>
    </>
  );
}
