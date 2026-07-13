import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Save, Building, Phone, Mail, User, Upload } from 'lucide-react';

export default function LabSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get('/settings');
        setSettings(response.data);
        localStorage.setItem('labSettings', JSON.stringify(response.data));
      } catch (err) {
        console.error('Error loading settings:', err);
        // Fall back to default values
        const fallbackSettings = {
          labName: 'Shri Dhanvantari Pathology & Diagnostic Centre',
          labAddress: '42, Nehru Nagar, Near District Hospital, Lucknow, Uttar Pradesh - 226001',
          labPhone: '+91-522-2601234',
          labEmail: 'info@dhanvantarilab.in',
          labDirector: 'Dr. Rajesh Kumar Sharma',
          labDirectorQualification: 'MBBS, MD (Pathology), NABL Accredited',
          reportFooter: 'This report is electronically generated. For queries, contact: +91-522-2601234',
          registrationNumber: 'UP-DL-2019-04521',
          includeHeader: true,
          includeFooter: true,
          autoPrint: false,
          reportLayout: 'standard',
          autoIpNumber: true,
          ipNumberPrefix: 'IP-',
        };
        setSettings(fallbackSettings);
        localStorage.setItem('labSettings', JSON.stringify(fallbackSettings));
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.put('/settings', settings);
      setSettings(response.data);
      localStorage.setItem('labSettings', JSON.stringify(response.data));
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'signature');
    setUploading(true);
    try {
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSettings(s => ({ ...s, doctorSignature: uploadRes.data.url }));
      toast.success('Signature uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error uploading signature');
    } finally {
      setUploading(false);
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
          <h2 className="text-base font-semibold text-slate-800 mb-4">Report Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="label">WhatsApp Share Header Text</label>
              <input value={settings.reportHeader || ''} onChange={e => setSettings(s => ({ ...s, reportHeader: e.target.value }))} className="input-field" placeholder="Shown only in WhatsApp shared PDF" />
            </div>
            <div>
              <label className="label">Report Footer Note</label>
              <textarea value={settings.reportFooter || ''} onChange={e => setSettings(s => ({ ...s, reportFooter: e.target.value }))} className="input-field" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Report Layout</label>
                <select value={settings.reportLayout} onChange={e => setSettings(s => ({ ...s, reportLayout: e.target.value }))} className="input-field">
                  <option value="standard">Standard</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
              <div>
                <label className="label">IP Number Prefix</label>
                <input value={settings.ipNumberPrefix || 'IP-'} onChange={e => setSettings(s => ({ ...s, ipNumberPrefix: e.target.value }))} className="input-field" placeholder="IP-" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center justify-between gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
                <span>
                  <p className="font-medium text-slate-800">Include Header</p>
                  <p className="text-sm text-slate-500">Saved for share layout preferences. Printed reports stay header-free.</p>
                </span>
                <input type="checkbox" checked={settings.includeHeader} onChange={e => setSettings(s => ({ ...s, includeHeader: e.target.checked }))} className="h-5 w-5 rounded border-slate-300 text-primary-600" />
              </label>
              <label className="flex items-center justify-between gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
                <span>
                  <p className="font-medium text-slate-800">Include Footer</p>
                  <p className="text-sm text-slate-500">Show the footer note at the bottom of reports.</p>
                </span>
                <input type="checkbox" checked={settings.includeFooter} onChange={e => setSettings(s => ({ ...s, includeFooter: e.target.checked }))} className="h-5 w-5 rounded border-slate-300 text-primary-600" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center justify-between gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
                <span>
                  <p className="font-medium text-slate-800">Enable Auto Print</p>
                  <p className="text-sm text-slate-500">Automatically open the print dialog after report generation.</p>
                </span>
                <input type="checkbox" checked={settings.autoPrint} onChange={e => setSettings(s => ({ ...s, autoPrint: e.target.checked }))} className="h-5 w-5 rounded border-slate-300 text-primary-600" />
              </label>
              <label className="flex items-center justify-between gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
                <span>
                  <p className="font-medium text-slate-800">Auto IP Number</p>
                  <p className="text-sm text-slate-500">Generate IP numbers automatically during registration.</p>
                </span>
                <input type="checkbox" checked={settings.autoIpNumber} onChange={e => setSettings(s => ({ ...s, autoIpNumber: e.target.checked }))} className="h-5 w-5 rounded border-slate-300 text-primary-600" />
              </label>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Digital Signature</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Doctor Signature</label>
              <div className="flex items-center gap-3">
                <label className="btn-secondary cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload Signature'}
                  <input type="file" accept="image/*,.pdf" onChange={handleUpload} className="hidden" />
                </label>
                {settings.doctorSignature && (
                  <span className="text-sm text-slate-600 break-all">{settings.doctorSignature}</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">Upload a signature image to include only in WhatsApp shared PDFs.</p>
            </div>
            {settings.doctorSignature && (
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                <img src={settings.doctorSignature} alt="Doctor Signature" className="max-h-24 object-contain" />
              </div>
            )}
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
