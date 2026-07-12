import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { formatDate, calculateFlag, getFlagColor } from '../../utils/helpers';
import { ChevronLeft, Printer, Save, CheckCircle, RefreshCw } from 'lucide-react';
import ReportPrint from '../../components/reports/ReportPrint';
import { useReactToPrint } from 'react-to-print';

export default function EnterResults() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [printReport, setPrintReport] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const printRef = useRef();

  const handlePrint = useReactToPrint({ content: () => printRef.current });

  const doPrint = (report) => {
    setPrintReport(report);
    setTimeout(handlePrint, 100);
  };

  const load = async () => {
    try {
      const [aptRes, rptRes] = await Promise.all([
        api.get(`/appointments/${appointmentId}`),
        api.get(`/reports/appointment/${appointmentId}`),
      ]);
      setAppointment(aptRes.data);
      setSelectedStatus(aptRes.data.status || 'pending');
      setReports(rptRes.data.map(r => ({
        ...r,
        results: r.results.map(res => ({ ...res })),
        remarksInput: r.remarks || '',
      })));
    } catch (err) {
      toast.error('Error loading appointment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [appointmentId]);

  const updateResult = (reportIdx, resultIdx, value) => {
    setReports(prev => {
      const updated = [...prev];
      const result = { ...updated[reportIdx].results[resultIdx], value };
      
      // Get parameter info from test
      const report = updated[reportIdx];
      const param = report.test?.parameters?.find(p => p.name === result.parameterName);
      
      // Update result fields from parameter
      if (param) {
        result.unit = param.unit || result.unit;
        result.type = param.type;
        // Use general normal range as default
        result.normalRange = param.normalRange?.general?.text || result.normalRange;
      }
      
      // Auto-calculate flag for numeric types
      if (param && param.type === 'numeric' && value) {
        result.flag = calculateFlag(value, param.normalRange, appointment?.patient?.gender);
      } else {
        result.flag = '';
      }
      
      updated[reportIdx].results[resultIdx] = result;
      return updated;
    });
  };

  const updateAppointmentStatus = async () => {
    if (!selectedStatus || selectedStatus === appointment.status) return;
    setStatusUpdating(true);
    try {
      await api.put(`/appointments/${appointmentId}`, { status: selectedStatus });
      toast.success(`Status updated to "${selectedStatus}"`);
      setAppointment(prev => ({ ...prev, status: selectedStatus }));
    } catch (err) {
      toast.error('Error updating status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const saveReport = async (report, idx, action = 'save') => {    setSaving(idx);
    try {
      const newStatus = action === 'verify' ? 'verified' : 'entered';
      await api.put(`/reports/${report._id}`, {
        results: report.results,
        remarks: report.remarksInput,
        status: newStatus,
      });
      toast.success(action === 'verify' ? 'Report verified!' : 'Results saved!');
      load();
    } catch (err) {
      toast.error('Error saving report');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <LoadingSpinner text="Loading appointment..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Enter Test Results</h1>
          {appointment && (
            <p className="text-slate-500 text-sm">{appointment.patient?.name} • {appointment.appointmentId} • {formatDate(appointment.appointmentDate)}</p>
          )}
        </div>
      </div>

      {appointment && (
        <div className="card">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-slate-400">Patient</p><p className="font-semibold">{appointment.patient?.name}</p></div>
            <div><p className="text-slate-400">Age/Gender</p><p className="font-semibold">{appointment.patient?.age} {appointment.patient?.ageUnit} / {appointment.patient?.gender}</p></div>
            <div><p className="text-slate-400">Doctor</p><p className="font-semibold">{appointment.doctor?.name || 'Not assigned'}</p></div>
            <div><p className="text-slate-400">Priority</p><Badge status={appointment.priority === 'urgent' ? 'urgent' : 'normal'} /></div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
            <p className="text-sm text-slate-500 font-medium">Appointment Status:</p>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="input-field w-auto text-sm py-1.5"
            >
              <option value="pending">Pending</option>
              <option value="sample_collected">Sample Collected</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={updateAppointmentStatus}
              disabled={statusUpdating || selectedStatus === appointment.status}
              className="btn-primary py-1.5 px-4 text-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${statusUpdating ? 'animate-spin' : ''}`} />
              {statusUpdating ? 'Updating...' : 'Update Status'}
            </button>
            <Badge status={appointment.status} />
          </div>
        </div>
      )}

      {reports.map((report, idx) => (
        <div key={report._id} className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">{report.test?.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge status={report.status} />
                <span className="text-xs text-slate-400">• {report.test?.sampleType}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {report.status !== 'pending' && (
                <button
                  onClick={() => doPrint(report)}
                  className="btn-secondary py-2 px-3 flex items-center gap-1.5 text-sm"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
              )}
            </div>
          </div>

          {report.results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-3 font-semibold text-slate-600">Parameter</th>
                    <th className="text-left p-3 font-semibold text-slate-600 w-40">Result</th>
                    <th className="text-left p-3 font-semibold text-slate-600">Unit</th>
                    <th className="text-left p-3 font-semibold text-slate-600">Reference Range</th>
                    <th className="text-left p-3 font-semibold text-slate-600">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {report.results.map((result, rIdx) => {
                    const param = report.test?.parameters?.find(p => p.name === result.parameterName);
                    const isOptions = param?.type === 'options';
                    return (
                      <tr key={rIdx} className="border-t border-slate-100">
                        <td className="p-3 font-medium text-slate-700">{result.parameterName}</td>
                        <td className="p-3">
                          {isOptions ? (
                            <select
                              value={result.value || ''}
                              onChange={e => updateResult(idx, rIdx, e.target.value)}
                              className="border border-slate-200 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                              disabled={report.status === 'verified'}
                            >
                              <option value="">Select...</option>
                              {param?.options?.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input
                              type={param?.type === 'text' ? 'text' : 'number'}
                              step="any"
                              value={result.value || ''}
                              onChange={e => updateResult(idx, rIdx, e.target.value)}
                              className={`border rounded-lg px-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm ${result.flag === 'H' ? 'border-red-300 bg-red-50' : result.flag === 'L' ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`}
                              disabled={report.status === 'verified'}
                            />
                          )}
                        </td>
                        <td className="p-3 text-slate-500 text-xs">{result.unit}</td>
                        <td className="p-3 text-slate-500 text-xs">{result.normalRange}</td>
                        <td className="p-3">
                          {result.flag && result.flag !== 'N' && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${result.flag === 'H' ? 'bg-red-100 text-red-600' : result.flag === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                              {result.flag}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-slate-400 py-6">No parameters defined for this test</p>
          )}

          <div className="mt-4">
            <label className="label">Remarks / Comments</label>
            <textarea
              value={report.remarksInput}
              onChange={e => setReports(prev => { const u = [...prev]; u[idx].remarksInput = e.target.value; return u; })}
              className="input-field"
              rows={2}
              placeholder="Any remarks about this test..."
              disabled={report.status === 'verified'}
            />
          </div>

          {report.status !== 'verified' && (
            <div className="mt-4 flex gap-3 justify-end">
              <button
                onClick={() => saveReport(report, idx, 'save')}
                disabled={saving === idx}
                className="btn-secondary flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> {saving === idx ? 'Saving...' : 'Save Results'}
              </button>
              <button
                onClick={() => saveReport(report, idx, 'verify')}
                disabled={saving === idx || report.results.every(r => !r.value)}
                className="btn-success flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> {saving === idx ? 'Verifying...' : 'Verify & Sign'}
              </button>
            </div>
          )}
          {report.status === 'verified' && (
            <div className="mt-4 flex gap-3 justify-end">
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Report Verified
              </div>
              <button
                onClick={async () => {
                  try {
                    await api.put(`/reports/${report._id}`, { status: 'delivered' });
                    toast.success('Report marked as delivered!');
                    load();
                  } catch { toast.error('Error updating status'); }
                }}
                className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Mark as Delivered
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Hidden print component */}
      <div className="hidden">
        <div ref={printRef}>
          {printReport && appointment && (
            <ReportPrint report={printReport} appointment={appointment} />
          )}
        </div>
      </div>
    </div>
  );
}
