import { useState, useEffect } from 'react';
import { Search, UserPlus, Edit, ClipboardList, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const emptyEdit = { name: '', phone: '', age: '', ageUnit: 'years', gender: 'male', bloodGroup: '', address: '', referredBy: '', cnic: '', email: '', medicalHistory: '' };
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
  const navigate = useNavigate();
  const { user } = useAuth();

  const load = (s, p) => {
    setLoading(true);
    api.get(`/patients?search=${s}&page=${p}&limit=15`).then(r => {
      setPatients(r.data.patients);
      setTotal(r.data.total);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(search, page); }, [page]);

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
      ageUnit: p.ageUnit || 'years', gender: p.gender || 'male',
      bloodGroup: p.bloodGroup || '', address: p.address || '', referredBy: p.referredBy || '',
      cnic: p.cnic || '', email: p.email || '', medicalHistory: p.medicalHistory || '',
    });
    setEditModal(true);
  };

  const openNewPatient = () => {
    setIsNewPatient(true);
    setEditId(null);
    setEditForm(emptyEdit);
    setEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNewPatient) {
        const patient = await api.post('/patients', editForm);
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
      <div className="flex items-center justify-between">
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
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Patient ID</th>
                <th className="table-th">Name</th>
                <th className="table-th">Age / Gender</th>
                <th className="table-th">Phone</th>
                <th className="table-th">Blood Group</th>
                <th className="table-th">Referred By</th>
                <th className="table-th">Registered</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 && (
                <tr><td colSpan="8" className="text-center py-12 text-slate-400">No patients found</td></tr>
              )}
              {patients.map(p => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td className="table-td"><span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{p.patientId}</span></td>
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
            <div><label className="label">Full Name *</label><input required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Patient full name" /></div>
            <div><label className="label">Phone *</label><input required value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="+91-XXXXX-XXXXX" /></div>
          </div>
          <div><label className="label">Email (Optional)</label><input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="input-field" placeholder="email@example.com" /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Age *</label><input required type="number" min="0" max="150" value={editForm.age} onChange={e => setEditForm(f => ({ ...f, age: e.target.value }))} className="input-field" /></div>
            <div>
              <label className="label">Age Unit</label>
              <select value={editForm.ageUnit} onChange={e => setEditForm(f => ({ ...f, ageUnit: e.target.value }))} className="input-field">
                <option value="years">Years</option>
                <option value="months">Months</option>
                <option value="days">Days</option>
              </select>
            </div>
            <div>
              <label className="label">Gender *</label>
              <select required value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))} className="input-field">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">CNIC (Optional)</label><input value={editForm.cnic} onChange={e => setEditForm(f => ({ ...f, cnic: e.target.value }))} className="input-field" placeholder="XXXXX-XXXXXXX-X" /></div>
            <div>
              <label className="label">Blood Group</label>
              <select value={editForm.bloodGroup} onChange={e => setEditForm(f => ({ ...f, bloodGroup: e.target.value }))} className="input-field">
                {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
          </div>
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
