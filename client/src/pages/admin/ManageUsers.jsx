import { useState, useEffect } from 'react';
import { Plus, Edit, UserCog, Eye, EyeOff, Users, Stethoscope, UserCheck } from 'lucide-react';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';

const emptyForm = { name: '', email: '', password: '', role: 'receptionist', phone: '' };

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');

  const load = () => api.get('/users').then(r => setUsers(r.data)).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = (role = 'receptionist') => { setEditing(null); setForm({ ...emptyForm, role }); setShowPass(false); setModal(true); };
  const openEdit = (u) => { setEditing(u._id); setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '' }); setShowPass(false); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (editing) await api.put(`/users/${editing}`, data);
      else await api.post('/users', data);
      toast.success(editing ? 'User updated!' : 'User created!');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving user');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id, active) => {
    if (!confirm(`${active ? 'Deactivate' : 'Activate'} this user?`)) return;
    try {
      if (active) {
        await api.delete(`/users/${id}`);
        toast.success('User deactivated');
      } else {
        await api.put(`/users/${id}/activate`);
        toast.success('User activated');
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating user status');
    }
  };

  const roleColors = { admin: 'purple', receptionist: 'blue', doctor: 'green' };
  const filteredUsers = roleFilter ? users.filter(u => u.role === roleFilter) : users;

  const tabs = [
    { label: 'All Staff', value: '', icon: Users, count: users.length },
    { label: 'Receptionists', value: 'receptionist', icon: UserCheck, count: users.filter(u => u.role === 'receptionist').length },
    { label: 'Doctors', value: 'doctor', icon: Stethoscope, count: users.filter(u => u.role === 'doctor').length },
    { label: 'Admins', value: 'admin', icon: UserCog, count: users.filter(u => u.role === 'admin').length },
  ];

  if (loading) return <LoadingSpinner text="Loading users..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Staff Users</h1>
          <p className="text-slate-500 text-sm">{users.filter(u => u.active).length} active · {users.filter(u => !u.active).length} inactive</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openAdd('receptionist')} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors">
            <UserCheck className="w-4 h-4" /> Add Receptionist
          </button>
          <button onClick={() => openAdd('admin')} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.value} onClick={() => setRoleFilter(tab.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              roleFilter === tab.value
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-700'
            }`}>
            <tab.icon className="w-4 h-4" />{tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              roleFilter === tab.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-th">Name</th>
              <th className="table-th">Email</th>
              <th className="table-th">Role</th>
              <th className="table-th">Phone</th>
              <th className="table-th">Last Login</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="hover:bg-slate-50">
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">{u.name?.charAt(0)}</div>
                    <span className="font-medium text-slate-800">{u.name}</span>
                  </div>
                </td>
                <td className="table-td text-slate-500">{u.email}</td>
                <td className="table-td"><Badge label={u.role.charAt(0).toUpperCase() + u.role.slice(1)} color={roleColors[u.role]} /></td>
                <td className="table-td text-slate-500">{u.phone || '-'}</td>
                <td className="table-td text-xs text-slate-400">{u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</td>
                <td className="table-td">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="table-td">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-blue-50 text-blue-500"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => toggleActive(u._id, u.active)} className={`p-1.5 rounded text-xs ${u.active ? 'hover:bg-red-50 text-red-400' : 'hover:bg-green-50 text-green-500'}`}>
                      {u.active ? '⊘' : '✓'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit User' : 'Add New User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Full Name *</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" /></div>
            <div><label className="label">Email *</label><input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Password {editing && '(leave blank to keep)'}</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!editing} className="input-field pr-10" minLength={editing ? 0 : 6} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <div>
              <label className="label">Role *</label>
              <select required value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input-field">
                <option value="receptionist">Receptionist</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div><label className="label">Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="+91-XXXXX-XXXXX" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update User' : 'Create User'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
