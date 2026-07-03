import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { UserPlus, ChevronLeft } from 'lucide-react';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

export default function RegisterPatient() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', age: '', ageUnit: 'years', gender: 'male', phone: '',
    email: '', address: '', cnic: '', ipNumber: '', bloodGroup: 'Unknown', referredBy: '', medicalHistory: '',
  });
  const [tests, setTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [settings, setSettings] = useState({ autoIpNumber: true });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/tests').then(res => setTests(res.data)).catch(() => setTests([]));
    api.get('/settings').then(res => setSettings(res.data)).catch(() => {});
  }, []);

  const toggleTest = (test) => {
    setSelectedTests(prev => prev.find(t => t._id === test._id) ? prev.filter(t => t._id !== test._id) : [...prev, test]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (settings.autoIpNumber === false && !form.ipNumber) {
        toast.error('Please enter a valid IP Number or enable automatic IP generation in settings.');
        setLoading(false);
        return;
      }
      const patient = await api.post('/patients', { ...form, tests: selectedTests.map(t => t._id) });
      toast.success(`Patient registered! ID: ${patient.data.patientId}`);
      if (selectedTests.length > 0) {
        await api.post('/appointments', {
          patient: patient.data._id,
          tests: selectedTests.map(t => t._id),
          appointmentDate: new Date().toISOString().split('T')[0],
          priority: 'normal',
          referredBy: form.referredBy,
          notes: 'Patient registered with tests from initial admission.',
        });
        toast.success('Appointment created and tests linked to the patient.');
        navigate('/reception/appointments');
      } else {
        navigate('/reception/new-appointment', { state: { patientId: patient.data._id, patient: patient.data } });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error registering patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Register New Patient</h1>
          <p className="text-slate-500 text-sm">Fill in patient information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Personal Information</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Full Name *</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Patient full name" /></div>
          <div>
            <label className="label">Age *</label>
            <div className="flex gap-2">
              <input required type="number" min="0" max="150" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} className="input-field" placeholder="Age" />
              <select value={form.ageUnit} onChange={e => setForm(f => ({ ...f, ageUnit: e.target.value }))} className="input-field w-28">
                <option value="years">Years</option>
                <option value="months">Months</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Gender *</label>
            <select required value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className="input-field">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Phone Number *</label><input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="+91-XXXXXXXXXX" /></div>
          <div><label className="label">Email (Optional)</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" placeholder="email@example.com" /></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">CNIC (Optional)</label><input value={form.cnic} onChange={e => setForm(f => ({ ...f, cnic: e.target.value }))} className="input-field" placeholder="XXXXX-XXXXXXX-X" /></div>
          <div>
            <label className="label">IP Number</label>
            <input
              disabled={settings.autoIpNumber}
              value={form.ipNumber}
              onChange={e => setForm(f => ({ ...f, ipNumber: e.target.value }))}
              className="input-field"
              placeholder={settings.autoIpNumber ? 'Auto-generated after save' : 'Enter IP number'}
            />
            {!settings.autoIpNumber && <p className="text-xs text-slate-500 mt-1">IP number must be unique.</p>}
            {settings.autoIpNumber && <p className="text-xs text-slate-500 mt-1">Auto-IP mode is enabled in Lab Settings.</p>}
          </div>
        </div>

        <div>
          <label className="label">Blood Group</label>
          <select value={form.bloodGroup} onChange={e => setForm(f => ({ ...f, bloodGroup: e.target.value }))} className="input-field">
            {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </div>

        <div><label className="label">Selected Tests</label>
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
            {tests.length === 0 ? (
              <p className="text-sm text-slate-500">Loading available tests...</p>
            ) : (
              tests.slice(0, 10).map(test => {
                const selected = selectedTests.some(t => t._id === test._id);
                return (
                  <button
                    key={test._id}
                    type="button"
                    onClick={() => toggleTest(test)}
                    className={`w-full text-left px-3 py-2 rounded-xl border ${selected ? 'border-primary-500 bg-primary-50' : 'border-slate-200 bg-white'} transition`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-800">{test.name}</p>
                        <p className="text-xs text-slate-500">{test.shortName}</p>
                      </div>
                      <span className={`text-xs font-semibold ${selected ? 'text-primary-700' : 'text-slate-600'}`}>
                        {selected ? 'Selected' : `₹${test.price}`}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          {selectedTests.length > 0 && (
            <div className="mt-2 text-sm text-slate-600">
              {selectedTests.length} selected tests: {selectedTests.map(t => t.name).join(', ')}
            </div>
          )}
        </div>

        <div><label className="label">Address</label><textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input-field" rows={2} placeholder="Patient's address" /></div>

        <div><label className="label">Referred By (Doctor/Hospital)</label><input value={form.referredBy} onChange={e => setForm(f => ({ ...f, referredBy: e.target.value }))} className="input-field" placeholder="Dr. Name / Hospital name" /></div>

        <div><label className="label">Medical History / Notes</label><textarea value={form.medicalHistory} onChange={e => setForm(f => ({ ...f, medicalHistory: e.target.value }))} className="input-field" rows={3} placeholder="Any relevant medical history..." /></div>

        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 flex-1 justify-center">
            <UserPlus className="w-4 h-4" />
            {loading ? 'Registering...' : 'Register Patient & Create Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}
