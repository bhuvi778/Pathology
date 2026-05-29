import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';
import { ClipboardList, Search, UserX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PatientQueue() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const load = () => {
    setLoading(true);
    // doctorProfile may be a populated object or just an ID string
    const doctorId = user?.doctorProfile?._id || user?.doctorProfile;
    if (!doctorId) { setLoading(false); return; }
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    params.set('doctorId', doctorId);
    params.set('limit', 50);
    api.get(`/appointments?${params.toString()}`).then(r => {
      setAppointments(r.data.appointments);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Patient Queue</h1>
        <p className="text-slate-500 text-sm">Appointments assigned to you</p>
      </div>

      {!user?.doctorProfile && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
          <UserX className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">Your account is not linked to a doctor profile. Please contact the admin.</p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {[['', 'All Active'], ['pending', 'Pending'], ['sample_collected', 'Sample Collected'], ['processing', 'Processing'], ['completed', 'Completed']].map(([v, l]) => (
          <button key={v} onClick={() => setStatusFilter(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${statusFilter === v ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {appointments.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
              <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400">No appointments in this queue</p>
            </div>
          )}
          {appointments.map((apt, i) => (
            <div key={apt._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:border-primary-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{apt.patient?.name}</p>
                      {apt.priority === 'urgent' && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">URGENT</span>}
                    </div>
                    <p className="text-sm text-slate-500">{apt.patient?.patientId} • {apt.patient?.age} {apt.patient?.ageUnit} • {apt.patient?.gender}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {apt.tests?.map(t => t.shortName || t.name).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={apt.status} />
                  <button onClick={() => navigate(`/doctor/results/${apt._id}`)} className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4" /> Enter Results
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-4 text-xs text-slate-400">
                <span>Appt: {apt.appointmentId}</span>
                <span>Date: {formatDate(apt.appointmentDate)}</span>
                <span>Ordered by: {apt.createdBy?.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
