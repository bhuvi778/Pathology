import { useState, useEffect } from 'react';
import { Beaker, CheckCircle2, Clock, Search, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function SampleCollection() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingSamples();
  }, []);

  const fetchPendingSamples = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get(`/appointments?status=pending&date=${today}&limit=50`);
      setAppointments(res.data.appointments || []);
    } catch (err) {
      toast.error('Unable to load sample collection tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCollect = async (appointmentId) => {
    setUpdating(appointmentId);
    try {
      await api.put(`/appointments/${appointmentId}`, {
        status: 'sample_collected',
        sampleCollectedAt: new Date().toISOString(),
      });
      toast.success('Sample marked as collected');
      await fetchPendingSamples();
    } catch (err) {
      toast.error('Failed to update sample status');
    } finally {
      setUpdating('');
    }
  };

  const filtered = appointments.filter((apt) => {
    const term = searchText.toLowerCase();
    return (
      apt.patient?.name?.toLowerCase().includes(term) ||
      apt.patient?.patientId?.toLowerCase().includes(term) ||
      apt.appointmentId?.toLowerCase().includes(term)
    );
  });

  if (loading) return <LoadingSpinner text="Loading sample collection tasks..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/reception')} className="p-2 rounded-lg hover:bg-slate-100">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sample Collection</h1>
          <p className="text-slate-500 text-sm">Manage pending samples and mark them collected</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card bg-slate-50 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center">
              <Beaker className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Pending Collections</p>
              <p className="text-sm text-slate-500">{appointments.length} appointments awaiting sample collection today</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="input-field pl-10 w-full"
              placeholder="Search by patient name, ID, or appointment ID"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16 text-slate-500">
          <Clock className="w-12 h-12 mx-auto mb-4" />
          <p>No pending sample collections matching your search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((apt) => (
            <div key={apt._id} className="card p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                    {apt.patient?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{apt.patient?.name}</p>
                    <p className="text-sm text-slate-500">{apt.patient?.patientId}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-500">
                  <div>
                    <p className="font-medium text-slate-800">Appointment</p>
                    <p>{apt.appointmentId}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Schedule</p>
                    <p>{formatDate(apt.appointmentDate, 'dd MMM yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Tests</p>
                    <p>{apt.tests?.length || 0}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Status</p>
                    <Badge status={apt.status} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:items-end">
                <button
                  disabled={updating === apt._id}
                  onClick={() => handleCollect(apt._id)}
                  className="btn-primary px-4 py-2 rounded-xl text-sm"
                >
                  {updating === apt._id ? 'Collecting...' : 'Mark Collected'}
                </button>
                <button onClick={() => navigate(`/reception/appointments`)} className="btn-secondary px-4 py-2 rounded-xl text-sm">
                  View Appointments
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
