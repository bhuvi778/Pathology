import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, Plus, X, Printer, ChevronLeft, AlertCircle, CheckCircle, Calendar, ListChecks } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, getCategoryLabel } from '../../utils/helpers';
import AppointmentReceiptPrint from '../../components/billing/AppointmentReceiptPrint';
import { useReactToPrint } from 'react-to-print';

const CATEGORIES = ['hematology', 'biochemistry', 'serology', 'urology', 'microbiology', 'hormones', 'radiology', 'cardiology', 'other'];

export default function NewAppointment() {
  const location = useLocation();
  const navigate = useNavigate();
  const receiptRef = useRef();

  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(location.state?.patient || null);
  const [doctors, setDoctors] = useState([]);
  const [tests, setTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [catFilter, setCatFilter] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [form, setForm] = useState({
    doctor: '', appointmentDate: new Date().toISOString().split('T')[0],
    priority: 'normal', notes: '', referredBy: '',
  });
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);

  const handlePrint = useReactToPrint({ content: () => receiptRef.current });

  useEffect(() => {
    api.get('/doctors').then(r => setDoctors(r.data)).catch(console.error);
    api.get('/tests').then(r => setTests(r.data)).catch(console.error);
    if (location.state?.patientId && !location.state?.patient) {
      api.get(`/patients/${location.state.patientId}`).then(r => setSelectedPatient(r.data)).catch(console.error);
    }
  }, []);

  const searchPatients = async (q) => {
    setPatientSearch(q);
    if (q.length < 2) { setPatients([]); return; }
    setSearching(true);
    api.get(`/patients?search=${q}&limit=5`).then(r => setPatients(r.data.patients)).catch(console.error).finally(() => setSearching(false));
  };

  const filteredTests = tests.filter(t => {
    const matchSearch = !testSearch || t.name.toLowerCase().includes(testSearch.toLowerCase()) || t.shortName.toLowerCase().includes(testSearch.toLowerCase());
    const matchCat = !catFilter || t.category === catFilter;
    return matchSearch && matchCat;
  });

  const toggleTest = (test) => {
    setSelectedTests(prev => prev.find(t => t._id === test._id) ? prev.filter(t => t._id !== test._id) : [...prev, test]);
  };

  const total = selectedTests.reduce((acc, t) => acc + t.price, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) { toast.error('Please select a patient'); return; }
    setLoading(true);
    try {
      const data = {
        patient: selectedPatient._id,
        doctor: form.doctor || undefined,
        tests: selectedTests.map(t => t._id),
        appointmentDate: form.appointmentDate,
        priority: form.priority,
        notes: form.notes,
        referredBy: form.referredBy,
      };
      const apt = await api.post('/appointments', data);
      const created = { ...apt.data, patient: selectedPatient, tests: selectedTests, doctor: doctors.find(d => d._id === form.doctor) };
      setCreatedAppointment(created);
      toast.success(`Appointment created! ID: ${apt.data.appointmentId}`);
      setTimeout(() => handlePrint(), 300);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating appointment');
      setLoading(false);
    }
    // Note: do NOT setLoading(false) on success — keeps button disabled while showing success screen
  };

  // ✅ SUCCESS SCREEN — shown after appointment is created, prevents re-submission
  if (createdAppointment) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/reception/appointments')} className="p-2 rounded-lg hover:bg-slate-100"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
          <h1 className="text-2xl font-bold text-slate-800">Appointment Booked</h1>
        </div>

        <div className="bg-white rounded-2xl border-2 border-green-100 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Appointment Created Successfully!</h2>
            <p className="text-slate-500 text-sm mt-1">Appointment ID: <span className="font-mono font-bold text-primary-700">{createdAppointment.appointmentId}</span></p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Patient</span><span className="font-semibold text-slate-800">{createdAppointment.patient?.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Patient ID</span><span className="font-mono text-slate-600">{createdAppointment.patient?.patientId}</span></div>
            {createdAppointment.doctor && <div className="flex justify-between"><span className="text-slate-500">Doctor</span><span className="font-semibold text-slate-800">{createdAppointment.doctor?.name}</span></div>}
            {createdAppointment.tests?.length > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">Tests</span><span className="text-slate-700">{createdAppointment.tests.map(t => t.name).join(', ')}</span></div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <button onClick={() => handlePrint()} className="btn-secondary flex flex-col items-center gap-1 py-3">
              <Printer className="w-5 h-5" /><span className="text-xs">Print Receipt</span>
            </button>
            <button onClick={() => { setCreatedAppointment(null); setSelectedPatient(null); setSelectedTests([]); setForm({ doctor: '', appointmentDate: new Date().toISOString().split('T')[0], priority: 'normal', notes: '', referredBy: '' }); setLoading(false); }} className="btn-secondary flex flex-col items-center gap-1 py-3">
              <Calendar className="w-5 h-5" /><span className="text-xs">New Appointment</span>
            </button>
            <button onClick={() => navigate('/reception/appointments')} className="btn-primary flex flex-col items-center gap-1 py-3">
              <ListChecks className="w-5 h-5" /><span className="text-xs">View All</span>
            </button>
          </div>
        </div>

        {/* Hidden Receipt */}
        <div className="hidden">
          <div ref={receiptRef}>
            <AppointmentReceiptPrint appointment={createdAppointment} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">New Appointment</h1>
          <p className="text-slate-500 text-sm">Tests are optional — doctor can recommend tests later</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Patient & Tests */}
        <div className="lg:col-span-2 space-y-5">
          {/* Patient Selection */}
          <div className="card">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Patient Information</h2>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 bg-primary-50 rounded-xl border border-primary-100">
                <div>
                  <p className="font-semibold text-slate-800">{selectedPatient.name}</p>
                  <p className="text-sm text-slate-500">{selectedPatient.patientId} • {selectedPatient.age} {selectedPatient.ageUnit} • {selectedPatient.gender} • {selectedPatient.phone}</p>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={patientSearch}
                  onChange={e => searchPatients(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Search patient by name, ID, or phone..."
                />
                {patients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                    {patients.map(p => (
                      <button key={p._id} onClick={() => { setSelectedPatient(p); setPatients([]); setPatientSearch(''); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-0 border-slate-100">
                        <p className="font-medium text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.patientId} • {p.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button onClick={() => navigate('/reception/register')} className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Register new patient
            </button>
          </div>

          {/* Test Selection */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Select Tests</h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Optional — doctor will recommend</span>
            </div>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={testSearch} onChange={e => setTestSearch(e.target.value)} className="input-field pl-10 py-2 text-sm" placeholder="Search tests..." />
              </div>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field w-40 text-sm">
                <option value="">All</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {filteredTests.map(t => {
                const selected = selectedTests.find(s => s._id === t._id);
                return (
                  <button
                    key={t._id}
                    type="button"
                    onClick={() => toggleTest(t)}
                    className={`text-left p-3 rounded-xl border-2 transition-all text-sm ${selected ? 'border-primary-500 bg-primary-50' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`font-medium truncate ${selected ? 'text-primary-700' : 'text-slate-700'}`}>{t.name}</p>
                        <p className="text-xs text-slate-400">{t.shortName} • {t.turnaroundTime}</p>
                      </div>
                      <div>
                        <p className={`text-sm font-bold flex-shrink-0 ${selected ? 'text-primary-600' : 'text-green-600'}`}>{formatCurrency(t.price)}</p>
                        {selected && <span className="text-xs text-primary-500">✓ Selected</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Appointment Details */}
          <div className="card">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Appointment Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Assign Doctor</label>
                <select value={form.doctor} onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))} className="input-field">
                  <option value="">Select Doctor (Optional)</option>
                  {doctors.map(d => <option key={d._id} value={d._id}>{d.name} - {d.specialty}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date *</label>
                <input type="date" required value={form.appointmentDate} onChange={e => setForm(f => ({ ...f, appointmentDate: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="input-field">
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div><label className="label">Referred By</label><input value={form.referredBy} onChange={e => setForm(f => ({ ...f, referredBy: e.target.value }))} className="input-field" placeholder="Doctor/Hospital" /></div>
            </div>
            <div className="mt-4"><label className="label">Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-field" rows={2} placeholder="Additional notes..." /></div>
          </div>
        </div>

        {/* Right - Summary */}
        <div className="space-y-4">
          <div className="card sticky top-20">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Order Summary</h2>
            {selectedPatient ? (
              <div className="mb-4 p-3 bg-slate-50 rounded-xl">
                <p className="font-semibold text-slate-800 text-sm">{selectedPatient.name}</p>
                <p className="text-xs text-slate-400">{selectedPatient.patientId}</p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-amber-50 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <p className="text-xs text-amber-600">No patient selected</p>
              </div>
            )}

            {selectedTests.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm">No tests selected</p>
                <p className="text-xs text-slate-300 mt-1">Doctor will recommend tests during consultation</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedTests.map(t => (
                  <div key={t._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <button onClick={() => toggleTest(t)} className="flex-shrink-0 text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                      <span className="text-sm text-slate-700 truncate">{t.name}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-700 flex-shrink-0 ml-2">{formatCurrency(t.price)}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedTests.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Total</span>
                  <span className="text-xl font-bold text-primary-700">{formatCurrency(total)}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <button type="submit" disabled={loading || !selectedPatient} className="btn-primary w-full mt-4 py-3 text-base">
                {loading ? 'Creating...' : selectedTests.length > 0 ? 'Create Appointment & Print Receipt' : 'Create Appointment'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
