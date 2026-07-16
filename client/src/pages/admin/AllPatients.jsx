import { useState, useEffect } from 'react';
import { Search, UserPlus, Edit, ClipboardList, Trash2, FileText } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const emptyEdit = { name: '', phone: '', age: '', ageUnit: 'years', gender: '', bloodGroup: '', ipNumber: '', address: '', referredBy: '', cnic: '', email: '', medicalHistory: '' };
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

export default function AllPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState(emptyEdit);
  const [editId, setEditId] = useState(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tests, setTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [testSearch, setTestSearch] = useState('');
  const [settings, setSettings] = useState({ autoIpNumber: true });
  const navigate = useNavigate();
  const { user } = useAuth();

  const load = (s, p) => {
    setLoading(true);
    api.get(`/patients?search=${s}&page=${p}&limit=15`).then(r => {
      setPatients(r.data.patients);
      setTotal(r.data.total);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    load(search, page);
    api.get('/tests').then(r => setTests(r.data)).catch(() => setTests([]));
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {});
  }, [page]);

  useEffect(() => {
    if (editModal && isNewPatient && tests.length === 0) {
      api.get('/tests').then(r => setTests(r.data)).catch(() => setTests([]));
    }
  }, [editModal, isNewPatient, tests.length]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
    load(e.target.value, 1);
  };

  const openEdit = (p) => {
    setIsNewPatient(false);
    setEditId(p._id);
    setEditForm({
      name: p.name || '', phone: p.phone || '', age: p.age || '',
      ageUnit: p.ageUnit || 'years', gender: p.gender || '',
      bloodGroup: p.bloodGroup || '', address: p.address || '', referredBy: p.referredBy || '',
      cnic: p.cnic || '', email: p.email || '', medicalHistory: p.medicalHistory || '',
    });
    setSelectedTests([]);
    setEditModal(true);
  };

  const openNewPatient = () => {
    setIsNewPatient(true);
    setEditId(null);
    setEditForm(emptyEdit);
    setSelectedTests([]);
    setTestSearch('');
    setEditModal(true);
  };

  const openReportReading = async (patient) => {
    try {
      const testIds = (patient.tests || [])
        .map(test => (typeof test === 'string' ? test : test?._id))
        .filter(Boolean);

      if (testIds.length === 0) {
        toast.error('This patient has no tests assigned for report entry');
        return;
      }

      const appointmentRes = await api.get(`/appointments?patientId=${encodeURIComponent(patient._id)}&limit=20&page=1`);
      const existingAppointment = appointmentRes.data.appointments?.find(appt => appt.patient?._id === patient._id || appt.patient?.patientId === patient.patientId) || appointmentRes.data.appointments?.[0];

      if (existingAppointment?._id) {
        navigate(`/admin/fill-report/${existingAppointment._id}`);
        return;
      }

      const createdAppointment = await api.post('/appointments', {
        patient: patient._id,
        appointmentDate: new Date().toISOString(),
        status: 'pending',
        tests: testIds,
      });

      if (createdAppointment?.data?._id) {
        navigate(`/admin/fill-report/${createdAppointment.data._id}`);
        return;
      }

      toast.error('Could not create report entry for this patient');
    } catch (err) {
      if (err.response?.status === 409) {
        const fallbackRes = await api.get(`/appointments?patientId=${encodeURIComponent(patient._id)}&limit=20&page=1`);
        const fallbackAppointment = fallbackRes.data.appointments?.find(appt => appt.patient?._id === patient._id || appt.patient?.patientId === patient.patientId) || fallbackRes.data.appointments?.[0];
        if (fallbackAppointment?._id) {
          navigate(`/admin/fill-report/${fallbackAppointment._id}`);
          return;
        }
      }
      toast.error(err.response?.data?.message || 'Could not open report reading');
    }
  };

  const toggleTest = (test) => {
    setSelectedTests(prev => prev.find(t => t._id === test._id)
      ? prev.filter(t => t._id !== test._id)
      : [...prev, test]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNewPatient) {
        const patient = await api.post('/patients', { ...editForm, tests: selectedTests.map(t => t._id) });
        toast.success(`Patient registered! ID: ${patient.data.patientId}`);
      } else {
        await api.put(`/patients/${editId}`, editForm);
        toast.success('Patient details updated!');
      }
      setEditModal(false);
      load(search, page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving patient');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`"${p.name}" ko delete karna chahte hain? Yeh action undo nahi ho sakta.`)) return;
    try {
      await api.delete(`/patients/${p._id}`);
      toast.success('Patient deleted successfully');
      load(search, page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting patient');
    }
  };

  return (
    <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">All Patients</h1>
          <p className="text-slate-500 text-sm">{total} total patients registered</p>
        </div>
        <button onClick={openNewPatient} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> New Patient
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={handleSearch} className="input-field pl-10" placeholder="Search by name, ID, phone..." />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px]">
            <thead>
              <tr>
                <th className="table-th">Patient ID</th>
                <th className="table-th">IP Number</th>
                <th className="table-th">Name</th>
                <th className="table-th">Age / Gender</th>
                <th className="table-th">Phone</th>
                <th className="table-th">Blood Group</th>
                <th className="table-th">Tests</th>
                <th className="table-th">Referred By</th>
                <th className="table-th">Registered</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 && (
                <tr><td colSpan="9" className="text-center py-12 text-slate-400">No patients found</td></tr>
              )}
              {patients.map(p => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td className="table-td"><span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{p.patientId}</span></td>
                  <td className="table-td"><span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{p.ipNumber || '—'}</span></td>
                  <td className="table-td">
                    <p className="font-medium text-slate-800">{p.name}</p>
                  </td>
                  <td className="table-td text-sm text-slate-600">{p.age} {p.ageUnit} / {p.gender?.charAt(0).toUpperCase()}</td>
                  <td className="table-td text-slate-500">{p.phone}</td>
                  <td className="table-td">
                    {p.bloodGroup && p.bloodGroup !== 'Unknown' ? (
                      <span className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded font-bold">{p.bloodGroup}</span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="table-td text-sm text-slate-600">
                    {p.tests?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {p.tests.slice(0, 2).map(test => (
                          <span key={test._id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{test.shortName || test.name}</span>
                        ))}
                        {p.tests.length > 2 && <span className="text-xs text-slate-400">+{p.tests.length - 2}</span>}
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="table-td text-slate-500 text-sm">{p.referredBy || '—'}</td>
                  <td className="table-td text-xs text-slate-400">{formatDate(p.createdAt)}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        title="Edit Patient Details"
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 border border-amber-100"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => navigate('/reception/appointments', { state: { patientSearch: p.name } })}
                        title="View Appointments"
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 border border-blue-100"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                      </button>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => openReportReading(p)}
                          title="Fill Report Reading"
                          className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 border border-purple-100"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleDelete(p)}
                          title="Delete Patient"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 border border-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {total > 15 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Showing {patients.length} of {total} patients</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1 px-3 text-sm disabled:opacity-50">Previous</button>
            <span className="flex items-center text-sm text-slate-600">Page {page}</span>
            <button disabled={patients.length < 15} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1 px-3 text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* Patient Modal (New/Edit) */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title={isNewPatient ? 'Register New Patient' : 'Edit Patient Details'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Full Name</label><input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Patient full name" /></div>
            <div><label className="label">Phone</label><input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="+91-XXXXX-XXXXX" /></div>
          </div>
          <div><label className="label">Email (Optional)</label><input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="input-field" placeholder="email@example.com" /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Age</label><input type="number" min="0" max="150" value={editForm.age} onChange={e => setEditForm(f => ({ ...f, age: e.target.value }))} className="input-field" /></div>
            <div>
              <label className="label">Age Unit</label>
              <select value={editForm.ageUnit} onChange={e => setEditForm(f => ({ ...f, ageUnit: e.target.value }))} className="input-field">
                <option value="years">Years</option>
                <option value="months">Months</option>
                <option value="days">Days</option>
              </select>
            </div>
            <div>
              <label className="label">Gender</label>
              <select value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))} className="input-field">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">CNIC (Optional)</label><input value={editForm.cnic} onChange={e => setEditForm(f => ({ ...f, cnic: e.target.value }))} className="input-field" placeholder="XXXXX-XXXXXXX-X" /></div>
            {!isNewPatient && <div><label className="label">IP Number</label><input value={editForm.ipNumber || ''} onChange={e => setEditForm(f => ({ ...f, ipNumber: e.target.value }))} className="input-field" placeholder="Optional IP number" /></div>}
          </div>
          {!isNewPatient && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Blood Group</label>
                <select value={editForm.bloodGroup} onChange={e => setEditForm(f => ({ ...f, bloodGroup: e.target.value }))} className="input-field">
                  <option value="">Select</option>
                  {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            </div>
          )}
          {isNewPatient && (
            <div>
              <label className="label">Select Tests</label>
              <p className="text-xs text-slate-500 mb-2">Choose tests to attach while registering the patient.</p>
              <input value={testSearch} onChange={e => setTestSearch(e.target.value)} className="input-field mb-3" placeholder="Search tests..." />
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
                {tests.length === 0 ? (
                  <p className="text-sm text-slate-500">Loading available tests...</p>
                ) : (
                  tests.filter(test => {
                    const q = testSearch.toLowerCase();
                    return !q || test.name?.toLowerCase().includes(q) || test.shortName?.toLowerCase().includes(q) || test.category?.toLowerCase().includes(q);
                  }).map(test => {
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
          )}
          <div><label className="label">Address</label><input value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} className="input-field" placeholder="Patient's address" /></div>
          <div><label className="label">Referred By (Doctor/Hospital)</label><input value={editForm.referredBy} onChange={e => setEditForm(f => ({ ...f, referredBy: e.target.value }))} className="input-field" placeholder="Dr. Name / Hospital name" /></div>
          {isNewPatient && <div><label className="label">Medical History / Notes</label><textarea value={editForm.medicalHistory} onChange={e => setEditForm(f => ({ ...f, medicalHistory: e.target.value }))} className="input-field" rows={2} placeholder="Any relevant medical history..." /></div>}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setEditModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? (isNewPatient ? 'Registering...' : 'Saving...') : (isNewPatient ? 'Register Patient' : 'Save Changes')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
