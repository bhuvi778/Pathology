import { useState, useEffect } from 'react';
import { Plus, Edit, TestTube, Search, ChevronDown, Trash2, X } from 'lucide-react';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { getCategoryLabel, formatCurrency } from '../../utils/helpers';

const CATEGORIES = ['hematology', 'biochemistry', 'serology', 'urology', 'microbiology', 'hormones', 'radiology', 'cardiology', 'other'];
const CAT_COLORS = { hematology: 'bg-red-100 text-red-700', biochemistry: 'bg-blue-100 text-blue-700', serology: 'bg-purple-100 text-purple-700', urology: 'bg-yellow-100 text-yellow-700', microbiology: 'bg-green-100 text-green-700', hormones: 'bg-pink-100 text-pink-700', radiology: 'bg-slate-100 text-slate-700', cardiology: 'bg-orange-100 text-orange-700', other: 'bg-gray-100 text-gray-700' };

const PARAM_TYPES = ['numeric', 'text', 'options'];

export default function ManageTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', shortName: '', category: 'hematology', price: '', turnaroundTime: '24 hours', sampleType: 'Blood', description: '', parameters: [] });
  const [showParamForm, setShowParamForm] = useState(false);
  const [paramForm, setParamForm] = useState({ name: '', unit: '', type: 'numeric', normalRange: { male: { min: '', max: '', text: '' }, female: { min: '', max: '', text: '' }, general: { min: '', max: '', text: '' } }, options: [] });

  const load = () => api.get('/tests/all').then(r => setTests(r.data)).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = tests.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.shortName.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || t.category === catFilter;
    return matchSearch && matchCat;
  });

  const openEdit = (t) => {
    setEditing(t._id);
    setForm({ 
      name: t.name, 
      shortName: t.shortName, 
      category: t.category, 
      price: t.price, 
      turnaroundTime: t.turnaroundTime, 
      sampleType: t.sampleType, 
      description: t.description || '',
      parameters: t.parameters || []
    });
    setShowParamForm(false);
    setModal(true);
  };

  const addParameter = () => {
    if (!paramForm.name.trim()) {
      toast.error('Parameter name is required');
      return;
    }
    
    const newParam = {
      name: paramForm.name.trim(),
      unit: paramForm.unit || '',
      type: paramForm.type,
      normalRange: {
        male: { min: paramForm.normalRange.male.min ? Number(paramForm.normalRange.male.min) : undefined, max: paramForm.normalRange.male.max ? Number(paramForm.normalRange.male.max) : undefined, text: paramForm.normalRange.male.text || '' },
        female: { min: paramForm.normalRange.female.min ? Number(paramForm.normalRange.female.min) : undefined, max: paramForm.normalRange.female.max ? Number(paramForm.normalRange.female.max) : undefined, text: paramForm.normalRange.female.text || '' },
        general: { min: paramForm.normalRange.general.min ? Number(paramForm.normalRange.general.min) : undefined, max: paramForm.normalRange.general.max ? Number(paramForm.normalRange.general.max) : undefined, text: paramForm.normalRange.general.text || '' }
      },
      options: paramForm.type === 'options' ? paramForm.options.filter(o => o.trim()) : []
    };
    
    setForm(f => ({ ...f, parameters: [...f.parameters, newParam] }));
    setParamForm({ name: '', unit: '', type: 'numeric', normalRange: { male: { min: '', max: '', text: '' }, female: { min: '', max: '', text: '' }, general: { min: '', max: '', text: '' } }, options: [] });
    setShowParamForm(false);
    toast.success('Parameter added!');
  };

  const removeParameter = (idx) => {
    setForm(f => ({ ...f, parameters: f.parameters.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/tests/${editing}`, form);
      else await api.post('/tests', form);
      toast.success(editing ? 'Test updated!' : 'Test added!');
      setModal(false);
      load();
    } catch (err) {
      toast.error('Error saving test');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id, active) => {
    await api.put(`/tests/${id}`, { active: !active });
    toast.success(active ? 'Test deactivated' : 'Test activated');
    load();
  };

  if (loading) return <LoadingSpinner text="Loading tests..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tests & Prices</h1>
          <p className="text-slate-500 text-sm">{tests.filter(t => t.active).length} active tests</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: '', shortName: '', category: 'hematology', price: '', turnaroundTime: '24 hours', sampleType: 'Blood', description: '', parameters: [] }); setShowParamForm(false); setModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Test
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" placeholder="Search tests..." />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
        </select>
      </div>

      {/* Tests Grid */}
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-xl shadow-sm border border-slate-100">
          <thead>
            <tr>
              <th className="table-th rounded-tl-xl">Test Name</th>
              <th className="table-th">Category</th>
              <th className="table-th">Sample</th>
              <th className="table-th">TAT</th>
              <th className="table-th">Price</th>
              <th className="table-th">Status</th>
              <th className="table-th rounded-tr-xl">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t._id} className="hover:bg-slate-50">
                <td className="table-td">
                  <div>
                    <p className="font-medium text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.shortName} • {t.parameters?.length || 0} parameters</p>
                  </div>
                </td>
                <td className="table-td">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CAT_COLORS[t.category] || 'bg-gray-100 text-gray-700'}`}>
                    {getCategoryLabel(t.category)}
                  </span>
                </td>
                <td className="table-td text-xs text-slate-500">{t.sampleType}</td>
                <td className="table-td text-xs text-slate-500">{t.turnaroundTime}</td>
                <td className="table-td font-semibold text-green-700">{formatCurrency(t.price)}</td>
                <td className="table-td">
                  <button onClick={() => toggleActive(t._id, t.active)} className={`text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer ${t.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                    {t.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="table-td">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Edit className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Test' : 'Add New Test'}>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Test Name *</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" /></div>
            <div><label className="label">Short Name *</label><input required value={form.shortName} onChange={e => setForm(f => ({ ...f, shortName: e.target.value }))} className="input-field" placeholder="e.g., CBC" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field">
                {CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
              </select>
            </div>
            <div><label className="label">Price (₹) *</label><input required type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input-field" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Sample Type</label><input value={form.sampleType} onChange={e => setForm(f => ({ ...f, sampleType: e.target.value }))} className="input-field" /></div>
            <div><label className="label">Turnaround Time</label><input value={form.turnaroundTime} onChange={e => setForm(f => ({ ...f, turnaroundTime: e.target.value }))} className="input-field" /></div>
          </div>
          <div><label className="label">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field" rows={3} /></div>

          {/* Parameters Section */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="label font-bold">Test Parameters</label>
              <button type="button" onClick={() => setShowParamForm(!showParamForm)} className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add Parameter
              </button>
            </div>

            {showParamForm && (
              <div className="bg-slate-50 p-4 rounded-lg space-y-3 mb-4 border border-slate-200">
                <div><label className="label">Parameter Name *</label><input required value={paramForm.name} onChange={e => setParamForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="e.g., Hemoglobin" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Unit</label><input value={paramForm.unit} onChange={e => setParamForm(p => ({ ...p, unit: e.target.value }))} className="input-field" placeholder="e.g., g/dL" /></div>
                  <div>
                    <label className="label">Type *</label>
                    <select required value={paramForm.type} onChange={e => setParamForm(p => ({ ...p, type: e.target.value }))} className="input-field">
                      {PARAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {paramForm.type === 'options' && (
                  <div>
                    <label className="label">Options (comma-separated)</label>
                    <input value={paramForm.options.join(', ')} onChange={e => setParamForm(p => ({ ...p, options: e.target.value.split(',').map(o => o.trim()) }))} className="input-field" placeholder="e.g., Normal, Abnormal, Critical" />
                  </div>
                )}

                {paramForm.type === 'numeric' && (
                  <div>
                    <label className="label text-xs font-semibold mb-2 block">Normal Range (Male)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" placeholder="Min" value={paramForm.normalRange.male.min} onChange={e => setParamForm(p => ({ ...p, normalRange: { ...p.normalRange, male: { ...p.normalRange.male, min: e.target.value } } }))} className="input-field text-sm" />
                      <input type="number" placeholder="Max" value={paramForm.normalRange.male.max} onChange={e => setParamForm(p => ({ ...p, normalRange: { ...p.normalRange, male: { ...p.normalRange.male, max: e.target.value } } }))} className="input-field text-sm" />
                      <input type="text" placeholder="Text" value={paramForm.normalRange.male.text} onChange={e => setParamForm(p => ({ ...p, normalRange: { ...p.normalRange, male: { ...p.normalRange.male, text: e.target.value } } }))} className="input-field text-sm" />
                    </div>
                    <label className="label text-xs font-semibold mb-2 block mt-2">Normal Range (Female)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" placeholder="Min" value={paramForm.normalRange.female.min} onChange={e => setParamForm(p => ({ ...p, normalRange: { ...p.normalRange, female: { ...p.normalRange.female, min: e.target.value } } }))} className="input-field text-sm" />
                      <input type="number" placeholder="Max" value={paramForm.normalRange.female.max} onChange={e => setParamForm(p => ({ ...p, normalRange: { ...p.normalRange, female: { ...p.normalRange.female, max: e.target.value } } }))} className="input-field text-sm" />
                      <input type="text" placeholder="Text" value={paramForm.normalRange.female.text} onChange={e => setParamForm(p => ({ ...p, normalRange: { ...p.normalRange, female: { ...p.normalRange.female, text: e.target.value } } }))} className="input-field text-sm" />
                    </div>
                    <label className="label text-xs font-semibold mb-2 block mt-2">Normal Range (General)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" placeholder="Min" value={paramForm.normalRange.general.min} onChange={e => setParamForm(p => ({ ...p, normalRange: { ...p.normalRange, general: { ...p.normalRange.general, min: e.target.value } } }))} className="input-field text-sm" />
                      <input type="number" placeholder="Max" value={paramForm.normalRange.general.max} onChange={e => setParamForm(p => ({ ...p, normalRange: { ...p.normalRange, general: { ...p.normalRange.general, max: e.target.value } } }))} className="input-field text-sm" />
                      <input type="text" placeholder="Text" value={paramForm.normalRange.general.text} onChange={e => setParamForm(p => ({ ...p, normalRange: { ...p.normalRange, general: { ...p.normalRange.general, text: e.target.value } } }))} className="input-field text-sm" />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button type="button" onClick={addParameter} className="btn-primary py-1.5 px-3 text-sm flex-1">Save Parameter</button>
                  <button type="button" onClick={() => setShowParamForm(false)} className="btn-secondary py-1.5 px-3 text-sm">Cancel</button>
                </div>
              </div>
            )}

            {form.parameters.length > 0 && (
              <div className="space-y-2">
                {form.parameters.map((param, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-700">{param.name}</p>
                      <p className="text-xs text-slate-500">{param.type} {param.unit ? `• ${param.unit}` : ''}</p>
                    </div>
                    <button type="button" onClick={() => removeParameter(idx)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Add Test'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
