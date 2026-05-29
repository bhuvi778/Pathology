import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Save, Building, Phone, Mail, User, Upload } from 'lucide-react';

export default function LabSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Try loading from a settings endpoint or use defaults
    setSettings({
      labName: 'Shri Dhanvantari Pathology & Diagnostic Centre',
      labAddress: '42, Nehru Nagar, Near District Hospital, Lucknow, Uttar Pradesh - 226001',
      labPhone: '+91-522-2601234',
      labEmail: 'info@dhanvantarilab.in',
      labDirector: 'Dr. Rajesh Kumar Sharma',
      labDirectorQualification: 'MBBS, MD (Pathology), NABL Accredited',
      reportFooter: 'This report is electronically generated. For queries, contact: +91-522-2601234',
      registrationNumber: 'UP-DL-2019-04521',
    });
    setLoading(false);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Save to localStorage as backup
      localStorage.setItem('labSettings', JSON.stringify(settings));
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Lab Settings</h1>
        <p className="text-slate-500 text-sm">Configure your laboratory information for reports and receipts</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2"><Building className="w-4 h-4 text-primary-600" />Laboratory Information</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Laboratory Name *</label>
              <input required value={settings.labName} onChange={e => setSettings(s => ({ ...s, labName: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="label">Address *</label>
              <textarea value={settings.labAddress} onChange={e => setSettings(s => ({ ...s, labAddress: e.target.value }))} className="input-field" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Phone</label><input value={settings.labPhone} onChange={e => setSettings(s => ({ ...s, labPhone: e.target.value }))} className="input-field" /></div>
              <div><label className="label">Email</label><input type="email" value={settings.labEmail} onChange={e => setSettings(s => ({ ...s, labEmail: e.target.value }))} className="input-field" /></div>
            </div>
            <div><label className="label">Registration Number</label><input value={settings.registrationNumber} onChange={e => setSettings(s => ({ ...s, registrationNumber: e.target.value }))} className="input-field" /></div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2"><User className="w-4 h-4 text-primary-600" />Lab Director Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Director Name</label><input value={settings.labDirector} onChange={e => setSettings(s => ({ ...s, labDirector: e.target.value }))} className="input-field" /></div>
            <div><label className="label">Qualification</label><input value={settings.labDirectorQualification} onChange={e => setSettings(s => ({ ...s, labDirectorQualification: e.target.value }))} className="input-field" /></div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Report Settings</h2>
          <div>
            <label className="label">Report Footer Note</label>
            <textarea value={settings.reportFooter} onChange={e => setSettings(s => ({ ...s, reportFooter: e.target.value }))} className="input-field" rows={3} />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
