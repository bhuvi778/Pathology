import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Phone, Mail, KeyRound, Copy, CheckCircle, Shield } from 'lucide-react';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const emptyForm = {
  name: '', specialty: '', qualifications: '', phone: '', email: '',
  nmcNumber: '', consultationFee: 0, loginEmail: '', loginPassword: '',
};

export default function ManageDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [credModal, setCredModal] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = () => api.get('/doctors/all').then(r => setDoctors(r.data)).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = (d) => {
    setEditing(d._id);
    setForm({ name: d.name, specialty: d.specialty, qualifications: d.qualifications || '', phone: d.phone || '', email: d.email || '', nmcNumber: d.pmcNumber || '', consultationFee: d.consultationFee || 0, loginEmail: '', loginPassword: '' });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/doctors/${editing}`, {
          name: form.name, specialty: form.specialty, qualifications: form.qualifications,
          phone: form.phone, email: form.email, pmcNumber: form.nmcNumber,
          consultationFee: form.consultationFee,
        });
        toast.success('Doctor profile updated!');
        setModal(false);
        load();
      } else {
        const userRes = await api.post('/users', { name: form.name, email: form.loginEmail, password: form.loginPassword, role: 'doctor', phone: form.phone });
        await api.post('/doctors', {
          name: form.name, specialty: form.specialty, qualifications: form.qualifications,
          phone: form.phone, email: form.email, pmcNumber: form.nmcNumber,
          consultationFee: form.consultationFee, user: userRes.data._id,
        });
        setModal(false);
        setCredentials({ name: form.name, email: form.loginEmail, password: form.loginPassword });
        setCredModal(true);
        load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving doctor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this doctor?')) return;
    await api.delete(`/doctors/${id}`);
    toast.success('Doctor deactivated');
    load();
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.password}`);
    setCopied(true);
    toast.success('Credentials copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <LoadingSpinner text="Loading doctors..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Doctors</h1>
          <p className="text-slate-500 text-sm">{doctors.filter(d => d.active).length} active · {doctors.filter(d => !d.active).length} inactive</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Doctor
        </button>
      </div>

      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
        <KeyRound className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-500" />
        <div>
          <p className="font-semibold">Each doctor gets a unique portal login</p>
          <p className="text-blue-500 text-xs mt-0.5">When adding a new doctor, set their email &amp; password. They use it to login and enter test results.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {doctors.map(doc => (
          <div key={doc._id} className={`bg-white rounded-2xl border-2 p-5 transition-all hover:shadow-lg ${doc.active ? 'border-slate-100 hover:border-primary-200' : 'border-red-100 opacity-70'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xl shadow-sm select-none">
                  {doc.name?.split(' ').find(w => w !== 'Dr.' && w !== 'Dr')?.charAt(0) || 'D'}
                </div>
                <div>
                  <p className="font-bold text-slate-800 leading-tight">{doc.name}</p>
                  <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full mt-1 inline-block">{doc.specialty}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(doc)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(doc._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            {doc.qualifications && (
              <p className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-slate-400 flex-shrink-0" />{doc.qualifications}
              </p>
            )}
            <div className="space-y-1.5 text-xs">
              {doc.phone && <div className="flex items-center gap-2 text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />{doc.phone}</div>}
              {doc.email && <div className="flex items-center gap-2 text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />{doc.email}</div>}
              {doc.pmcNumber && <div className="flex items-center gap-2 text-slate-500"><span className="font-semibold text-slate-400 w-10">NMC:</span>{doc.pmcNumber}</div>}
            </div>
            <div className="mt-3">
              {doc.user ? (
                <div className="flex items-center gap-2 text-xs bg-green-50 text-green-700 px-3 py-2 rounded-xl border border-green-100">
                  <KeyRound className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <div className="min-w-0"><p className="font-semibold">Login Active</p><p className="text-green-600 truncate">{doc.user.email}</p></div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs bg-amber-50 text-amber-700 px-3 py-2 rounded-xl border border-amber-100">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" /><p>No login account linked</p>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-50">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${doc.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {doc.active ? '● Active' : '● Inactive'}
              </span>
              {doc.consultationFee > 0 && <span className="text-xs font-bold text-slate-600">₹{doc.consultationFee} / visit</span>}
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Doctor Profile' : 'Add New Doctor'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Doctor Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Full Name *</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Dr. Full Name" /></div>
              <div><label className="label">Specialty *</label><input required value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} className="input-field" placeholder="e.g., Pathologist" /></div>
            </div>
            <div className="mt-3"><label className="label">Qualifications</label><input value={form.qualifications} onChange={e => setForm(f => ({ ...f, qualifications: e.target.value }))} className="input-field" placeholder="e.g., MBBS, MD (Pathology)" /></div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div><label className="label">Mobile No.</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="+91-XXXXX-XXXXX" /></div>
              <div><label className="label">Contact Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" placeholder="doctor@hospital.com" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div><label className="label">NMC / State Reg. No.</label><input value={form.nmcNumber} onChange={e => setForm(f => ({ ...f, nmcNumber: e.target.value }))} className="input-field" placeholder="e.g., UP-MCI-2020-45678" /></div>
              <div><label className="label">Consultation Fee (₹)</label><input type="number" min="0" value={form.consultationFee} onChange={e => setForm(f => ({ ...f, consultationFee: e.target.value }))} className="input-field" placeholder="0" /></div>
            </div>
          </div>
          {!editing && (
            <div className="border-t border-slate-100 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Portal Login Credentials</p>
                  <p className="text-xs text-slate-400">Doctor uses these to login &amp; enter test results</p>
                </div>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Login Email *</label><input required type="email" value={form.loginEmail} onChange={e => setForm(f => ({ ...f, loginEmail: e.target.value }))} className="input-field bg-white" placeholder="doctor@email.in" /></div>
                  <div><label className="label">Password *</label><input required type="text" value={form.loginPassword} onChange={e => setForm(f => ({ ...f, loginPassword: e.target.value }))} className="input-field bg-white" placeholder="Min. 6 characters" minLength={6} /></div>
                </div>
                <p className="text-xs text-amber-600">💡 Note these credentials before saving — share them with the doctor.</p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />{saving ? 'Saving...' : editing ? 'Update Doctor' : 'Add Doctor & Create Login'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={credModal} onClose={() => setCredModal(false)} title="" size="sm">
        {credentials && (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Doctor Added!</h3>
              <p className="text-sm text-slate-500 mt-1">Share these credentials with <strong>{credentials.name}</strong></p>
            </div>
            <div className="bg-slate-900 rounded-2xl p-5 text-left space-y-3">
              <div className="flex items-center justify-between"><span className="text-slate-400 text-sm">Email</span><span className="text-green-400 font-mono text-sm font-bold">{credentials.email}</span></div>
              <div className="border-t border-slate-700" />
              <div className="flex items-center justify-between"><span className="text-slate-400 text-sm">Password</span><span className="text-amber-400 font-mono text-sm font-bold">{credentials.password}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={copyCredentials} className="btn-secondary flex items-center justify-center gap-2">
                {copied ? <><CheckCircle className="w-4 h-4 text-green-500" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
              </button>
              <button onClick={() => setCredModal(false)} className="btn-primary">Done</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
