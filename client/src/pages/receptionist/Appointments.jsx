import { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Printer, Eye, Trash2, X } from 'lucide-react';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { useNavigate, useLocation } from 'react-router-dom';
import AppointmentReceiptPrint from '../../components/billing/AppointmentReceiptPrint';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Appointments() {
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [patientSearch, setPatientSearch] = useState(location.state?.patientSearch || '');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedApt, setSelectedApt] = useState(null);
  const [receiptApt, setReceiptApt] = useState(null);
  const receiptRef = useRef();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (status) params.set('status', status);
    if (patientSearch) params.set('search', patientSearch);
    params.set('page', page);
    params.set('limit', 20);
    api.get(`/appointments?${params.toString()}`).then(r => {
      setAppointments(r.data.appointments);
      setTotal(r.data.total);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [date, status, patientSearch, page]);

  const handlePrint = useReactToPrint({ content: () => receiptRef.current });

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/appointments/${id}`, { status: newStatus });
      toast.success('Status updated');
      load();
    } catch (err) {
      toast.error('Error updating status');
    }
  };

  const handleDelete = async (apt) => {
    if (!confirm(`Delete appointment ${apt.appointmentId} for ${apt.patient?.name}? This will also delete related reports and bill.`)) return;
    try {
      await api.delete(`/appointments/${apt._id}`);
      toast.success('Appointment deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting appointment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
          <p className="text-slate-500 text-sm">{total} appointments</p>
        </div>
        <button onClick={() => navigate('/reception/new-appointment')} className="btn-primary flex items-center gap-2">
          <Calendar className="w-4 h-4" /> New Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={patientSearch}
            onChange={e => { setPatientSearch(e.target.value); setPage(1); }}
            className="input-field pl-9 w-52"
            placeholder="Search patient..."
          />
          {patientSearch && (
            <button onClick={() => { setPatientSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field w-auto" />
        {date && <button onClick={() => setDate('')} className="text-xs text-slate-400 hover:text-slate-600">Clear date</button>}
        <select value={status} onChange={e => setStatus(e.target.value)} className="input-field w-auto">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="sample_collected">Sample Collected</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Appt ID</th>
                <th className="table-th">Patient</th>
                <th className="table-th">Doctor</th>
                <th className="table-th">Tests</th>
                <th className="table-th">Priority</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 && (
                <tr><td colSpan="7" className="text-center py-12 text-slate-400">No appointments found</td></tr>
              )}
              {appointments.map(apt => (
                <tr key={apt._id} className="hover:bg-slate-50">
                  <td className="table-td"><span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{apt.appointmentId}</span></td>
                  <td className="table-td">
                    <div>
                      <p className="font-medium text-slate-800">{apt.patient?.name}</p>
                      <p className="text-xs text-slate-400">{apt.patient?.patientId} • {apt.patient?.phone}</p>
                    </div>
                  </td>
                  <td className="table-td text-slate-500 text-sm">{apt.doctor?.name || 'Not assigned'}</td>
                  <td className="table-td">
                    <div className="flex flex-wrap gap-1">
                      {apt.tests?.slice(0, 2).map(t => <span key={t._id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{t.shortName || t.name}</span>)}
                      {apt.tests?.length > 2 && <span className="text-xs text-slate-400">+{apt.tests.length - 2}</span>}
                    </div>
                  </td>
                  <td className="table-td">
                    {apt.priority === 'urgent' ? <span className="badge-urgent">URGENT</span> : <span className="text-xs text-slate-400">Normal</span>}
                  </td>
                  <td className="table-td">
                    <select
                      value={apt.status}
                      onChange={e => updateStatus(apt._id, e.target.value)}
                      className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="sample_collected">Sample Collected</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="table-td">
                    <div className="flex gap-1">
                      <button onClick={() => { setReceiptApt(apt); setTimeout(handlePrint, 100); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Print Receipt">
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => navigate(`/doctor/results/${apt._id}`)} className="p-1.5 rounded hover:bg-primary-50 text-primary-500" title="Enter Results">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(apt)} className="p-1.5 rounded hover:bg-red-50 text-red-400" title="Delete Appointment (Admin only)">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Hidden print component */}
      <div className="hidden">
        <div ref={receiptRef}>
          {receiptApt && <AppointmentReceiptPrint appointment={receiptApt} />}
        </div>
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Showing {appointments.length} of {total}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1 px-3 text-sm disabled:opacity-50">Previous</button>
            <span className="flex items-center text-sm text-slate-600">Page {page}</span>
            <button disabled={appointments.length < 20} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1 px-3 text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
