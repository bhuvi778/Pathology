import { useState, useEffect } from 'react';
import { Users, Calendar, FileText, CreditCard, Stethoscope, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { formatDate, formatCurrency } from '../../utils/helpers';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of lab operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Today's Patients" value={data?.stats?.todayPatients || 0} icon={Users} color="blue" subtitle={`Total: ${data?.stats?.totalPatients || 0}`} />
        <StatCard title="Today's Appointments" value={data?.stats?.todayAppointments || 0} icon={Calendar} color="purple" subtitle={`Total: ${data?.stats?.totalAppointments || 0}`} />
        <StatCard title="Pending Reports" value={data?.stats?.pendingReports || 0} icon={Clock} color="amber" subtitle="Awaiting entry" />
        <StatCard title="Today's Revenue" value={formatCurrency(data?.stats?.todayRevenue)} icon={CreditCard} color="green" subtitle={`Pending Bills: ${data?.stats?.pendingBills || 0}`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Doctors" value={data?.stats?.totalDoctors || 0} icon={Stethoscope} color="teal" />
        <StatCard title="Completed Reports" value={data?.stats?.completedReports || 0} icon={FileText} color="green" />
        <StatCard title="Total Bills" value={data?.stats?.totalBills || 0} icon={CreditCard} color="purple" />
        <StatCard title="Pending Bills" value={data?.stats?.pendingBills || 0} icon={AlertCircle} color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Weekly Patient Volume</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.weeklyData || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [v, 'Patients']} />
              <Bar dataKey="patients" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Weekly Revenue (₹)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.weeklyData || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="card">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Today's Appointments</h3>
        {data?.recentAppointments?.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No appointments today</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Patient</th>
                  <th className="table-th">Doctor</th>
                  <th className="table-th">Tests</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Time</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentAppointments?.map(apt => (
                  <tr key={apt._id} className="hover:bg-slate-50">
                    <td className="table-td">
                      <div>
                        <p className="font-medium text-slate-800">{apt.patient?.name}</p>
                        <p className="text-xs text-slate-400">{apt.patient?.patientId}</p>
                      </div>
                    </td>
                    <td className="table-td">{apt.doctor?.name || '-'}</td>
                    <td className="table-td">
                      <div className="flex flex-wrap gap-1">
                        {apt.tests?.slice(0, 2).map(t => (
                          <span key={t._id} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{t.name}</span>
                        ))}
                        {apt.tests?.length > 2 && <span className="text-xs text-slate-400">+{apt.tests.length - 2}</span>}
                      </div>
                    </td>
                    <td className="table-td"><Badge status={apt.status} /></td>
                    <td className="table-td text-xs text-slate-400">{formatDate(apt.createdAt, 'hh:mm a')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
