import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, CreditCard, UserPlus, ClipboardList, TrendingUp, FileText, Phone } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ReceptionDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading..." />;

  const quickActions = [
    { label: 'Register New Patient', icon: UserPlus, path: '/reception/register', color: 'bg-primary-600 hover:bg-primary-700', desc: 'Add a new patient to the system' },
    { label: 'New Appointment', icon: ClipboardList, path: '/reception/new-appointment', color: 'bg-green-600 hover:bg-green-700', desc: 'Schedule tests for a patient' },
    { label: 'View Appointments', icon: Calendar, path: '/reception/appointments', color: 'bg-purple-600 hover:bg-purple-700', desc: "Today's appointment list" },
    { label: 'View Reports', icon: FileText, path: '/reception/view-reports', color: 'bg-blue-600 hover:bg-blue-700', desc: 'View & share patient reports' },
    { label: 'Billing', icon: CreditCard, path: '/reception/billing', color: 'bg-amber-600 hover:bg-amber-700', desc: 'Manage payments' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reception Dashboard</h1>
        <p className="text-slate-500 text-sm">{formatDate(new Date(), 'EEEE, dd MMMM yyyy')}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {quickActions.map(action => (
          <button key={action.path} onClick={() => navigate(action.path)}
            className={`${action.color} text-white rounded-xl p-4 text-left transition-all hover:shadow-lg hover:-translate-y-0.5`}>
            <action.icon className="w-6 h-6 mb-2 opacity-90" />
            <p className="font-semibold text-sm">{action.label}</p>
            <p className="text-xs opacity-75 mt-1">{action.desc}</p>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Today's Patients" value={data?.stats?.todayPatients || 0} icon={Users} color="blue" />
        <StatCard title="Today's Appointments" value={data?.stats?.todayAppointments || 0} icon={Calendar} color="purple" />
        <StatCard title="Pending Reports" value={data?.stats?.pendingReports || 0} icon={Clock} color="amber" />
        <StatCard title="Today's Revenue" value={formatCurrency(data?.stats?.todayRevenue)} icon={CreditCard} color="green" />
      </div>

      {/* Today's Appointments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">Today's Appointments</h2>
          <button onClick={() => navigate('/reception/appointments')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">View All →</button>
        </div>
        {data?.recentAppointments?.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400">No appointments today</p>
            <button onClick={() => navigate('/reception/new-appointment')} className="btn-primary mt-4 py-2 px-4 text-sm">Schedule Now</button>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.recentAppointments?.map(apt => (
              <div key={apt._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {apt.patient?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{apt.patient?.name}</p>
                    <p className="text-xs text-slate-400">{apt.patient?.patientId} • {apt.tests?.length || 0} test(s)</p>
                  </div>
                </div>
                <Badge status={apt.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
