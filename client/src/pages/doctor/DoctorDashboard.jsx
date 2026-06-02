import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, Users } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function DoctorDashboard() {
  const [todayApts, setTodayApts] = useState([]);
  const [scheduledApts, setScheduledApts] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const doctorId = user?.doctorProfile?._id || user?.doctorProfile;
    if (!doctorId) { setLoading(false); return; }
    Promise.all([
      api.get(`/appointments/today?doctorId=${doctorId}`),
      api.get(`/appointments?doctorId=${doctorId}&status=pending&limit=50`),
      api.get(`/reports?status=pending&doctor=${doctorId}&limit=10`),
    ]).then(([apts, scheduled, rpts]) => {
      setTodayApts(apts.data);
      setScheduledApts(scheduled.data.appointments || []);
      setPendingReports(rpts.data.reports);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingSpinner text="Loading..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Doctor Dashboard</h1>
        <p className="text-slate-500 text-sm">{user?.name} • {formatDate(new Date(), 'EEEE, dd MMMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Today's Appointments" value={todayApts.length} icon={Users} color="blue" />
        <StatCard title="Scheduled Today" value={scheduledApts.filter(a => a.appointmentDate && new Date(a.appointmentDate).toDateString() === new Date().toDateString()).length} icon={Clock} color="purple" subtitle="All pending doctor appointments" />
        <StatCard title="Pending Reports" value={pendingReports.length} icon={Clock} color="amber" subtitle="Awaiting entry" />
        <StatCard title="Completed Today" value={todayApts.filter(a => a.status === 'completed').length} icon={CheckCircle} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Patients */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">Today's Patient Queue</h2>
            <button onClick={() => navigate('/doctor/queue')} className="text-sm text-primary-600 font-medium">View All →</button>
          </div>
          {todayApts.length === 0 && scheduledApts.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No patients today or scheduled</p>
          ) : todayApts.length === 0 && scheduledApts.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm text-slate-500 mb-3">No appointments today, but here are your upcoming scheduled patients.</div>
              {scheduledApts.slice(0, 5).map(apt => (
                <div key={apt._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/doctor/results/${apt._id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                      {apt.patient?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{apt.patient?.name}</p>
                      <p className="text-xs text-slate-400">{apt.tests?.length || 0} test(s) • {new Date(apt.appointmentDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge status={apt.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {todayApts.slice(0, 5).map(apt => (
                <div key={apt._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/doctor/results/${apt._id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                      {apt.patient?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{apt.patient?.name}</p>
                      <p className="text-xs text-slate-400">{apt.tests?.length || 0} test(s)</p>
                    </div>
                  </div>
                  <Badge status={apt.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Reports */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">Pending Reports</h2>
            <button onClick={() => navigate('/doctor/reports')} className="text-sm text-primary-600 font-medium">View All →</button>
          </div>
          {pendingReports.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-200 mx-auto mb-3" />
              <p className="text-slate-400">All reports are completed!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReports.slice(0, 5).map(r => (
                <div key={r._id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 hover:bg-amber-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/doctor/results/${r.appointment}`)}>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{r.patient?.name}</p>
                    <p className="text-xs text-slate-500">{r.test?.name}</p>
                  </div>
                  <span className="text-xs text-amber-600 font-medium bg-amber-100 px-2 py-1 rounded">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
