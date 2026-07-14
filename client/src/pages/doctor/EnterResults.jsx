import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { CheckCircle, ChevronLeft, Printer, RefreshCw, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import ReportPrint from '../../components/reports/ReportPrint';
import {
  calculateFlag,
  formatDate,
  getFlagBadgeClass,
  getReportTestLabel,
  groupReportResults,
  validateNumericResult,
} from '../../utils/helpers';

const getErrorKey = (reportId, resultIndex) => `${reportId}-${resultIndex}`;

export default function EnterResults({ title = 'Enter Test Results' }) {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [printReport, setPrintReport] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
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
      setReports((rptRes.data || []).map((report) => ({
        ...report,
        results: (report.results || []).map((result) => ({ ...result })),
        remarksInput: report.remarks || '',
      })));
      setFieldErrors({});
    } catch (err) {
      toast.error('Error loading appointment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [appointmentId]);

  const setResultError = (reportId, resultIndex, message) => {
    const errorKey = getErrorKey(reportId, resultIndex);
    setFieldErrors((current) => {
      if (!message && !current[errorKey]) return current;
      const next = { ...current };
      if (message) next[errorKey] = message;
      else delete next[errorKey];
      return next;
    });
  };

  const updateResult = (reportIndex, resultIndex, value) => {
    setReports((currentReports) => {
      const nextReports = [...currentReports];
      const report = { ...nextReports[reportIndex] };
      const results = [...report.results];
      const result = { ...results[resultIndex], value };

      const validationMessage = result.type === 'numeric'
        ? validateNumericResult(value, result)
        : '';
      setResultError(report._id, resultIndex, validationMessage);

      if (result.type === 'numeric' && value !== '' && !validationMessage) {
        result.flag = calculateFlag(value, { general: { min: result.rangeMin, max: result.rangeMax } }, appointment?.patient?.gender);
      } else if (value === '') {
        result.flag = '';
      }

      results[resultIndex] = result;
      report.results = results;
      nextReports[reportIndex] = report;
      return nextReports;
    });
  };

  const updateAppointmentStatus = async () => {
    if (!selectedStatus || selectedStatus === appointment.status) return;
    setStatusUpdating(true);
    try {
      await api.put(`/appointments/${appointmentId}`, { status: selectedStatus });
      toast.success(`Status updated to "${selectedStatus}"`);
      setAppointment((current) => ({ ...current, status: selectedStatus }));
    } catch (err) {
      toast.error('Error updating status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const saveReport = async (report, index, action = 'save') => {
    const reportErrors = report.results
      .map((result, resultIndex) => ({
        resultIndex,
        message: result.type === 'numeric' ? validateNumericResult(result.value, result) : '',
      }))
      .filter((entry) => entry.message);

    if (reportErrors.length) {
      reportErrors.forEach((entry) => setResultError(report._id, entry.resultIndex, entry.message));
      toast.error(reportErrors[0].message);
      return;
    }

    setSaving(index);
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
      toast.error(err?.response?.data?.message || 'Error saving report');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <LoadingSpinner text="Loading appointment..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
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
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3 flex-wrap">
            <p className="text-sm text-slate-500 font-medium">Appointment Status:</p>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
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

      {reports.map((report, reportIndex) => {
        const groupedResults = groupReportResults(report);
        const hasErrors = report.results.some((_, resultIndex) => fieldErrors[getErrorKey(report._id, resultIndex)]);
        const hasAnyValue = report.results.some((result) => String(result.value || '').trim());

        return (
          <div key={report._id} className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Combined Patient Report</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge status={report.status} />
                  <span className="text-xs text-slate-400">• {getReportTestLabel(report)}</span>
                  <span className="text-xs text-slate-400">• ID: {report.reportId}</span>
                </div>
              </div>
              {report.status !== 'pending' && (
                <button
                  onClick={() => doPrint(report)}
                  className="btn-secondary py-2 px-3 flex items-center gap-1.5 text-sm"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
              )}
            </div>

            <div className="space-y-6">
              {groupedResults.map((section) => (
                <div key={String(section.test?._id || section.testId)} className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">{section.test?.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{section.test?.sampleType || 'Sample not set'}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white">
                          <th className="text-left p-3 font-semibold text-slate-600">Parameter</th>
                          <th className="text-left p-3 font-semibold text-slate-600 w-52">Result</th>
                          <th className="text-left p-3 font-semibold text-slate-600">Unit</th>
                          <th className="text-left p-3 font-semibold text-slate-600">Reference Range</th>
                          <th className="text-left p-3 font-semibold text-slate-600">Flag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.results.map((result) => {
                          const resultIndex = report.results.findIndex((entry) => String(entry.test || '') === String(result.test || '') && entry.parameterName === result.parameterName);
                          const fieldError = fieldErrors[getErrorKey(report._id, resultIndex)];
                          const isOptions = result.type === 'options';

                          return (
                            <tr key={`${String(result.test || '')}-${result.parameterName}`} className="border-t border-slate-100 align-top">
                              <td className="p-3 font-medium text-slate-700">{result.parameterName}</td>
                              <td className="p-3">
                                {isOptions ? (
                                  <select
                                    value={result.value || ''}
                                    onChange={(event) => updateResult(reportIndex, resultIndex, event.target.value)}
                                    className="border border-slate-200 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                                    disabled={report.status === 'verified'}
                                  >
                                    <option value="">Select...</option>
                                    {(result.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                                  </select>
                                ) : (
                                  <input
                                    type={result.type === 'text' ? 'text' : 'number'}
                                    step="any"
                                    value={result.value || ''}
                                    onChange={(event) => updateResult(reportIndex, resultIndex, event.target.value)}
                                    className={`border rounded-lg px-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm ${fieldError ? 'border-red-300 bg-red-50' : result.flag === 'H' ? 'border-red-300 bg-red-50' : result.flag === 'L' ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`}
                                    disabled={report.status === 'verified'}
                                  />
                                )}
                                {fieldError && <p className="text-xs text-red-600 mt-1">{fieldError}</p>}
                              </td>
                              <td className="p-3 text-slate-500 text-xs">{result.unit || '—'}</td>
                              <td className="p-3 text-slate-500 text-xs">{result.normalRange || '—'}</td>
                              <td className="p-3">
                                {result.flag && (
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${getFlagBadgeClass(result.flag)}`}>
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
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="label">Remarks / Comments</label>
              <textarea
                value={report.remarksInput}
                onChange={(event) => setReports((currentReports) => {
                  const nextReports = [...currentReports];
                  nextReports[reportIndex] = { ...nextReports[reportIndex], remarksInput: event.target.value };
                  return nextReports;
                })}
                className="input-field"
                rows={2}
                placeholder="Any remarks about this report..."
                disabled={report.status === 'verified'}
              />
            </div>

            {report.status !== 'verified' && (
              <div className="mt-4 flex gap-3 justify-end flex-wrap">
                <button
                  onClick={() => saveReport(report, reportIndex, 'save')}
                  disabled={saving === reportIndex || hasErrors}
                  className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {saving === reportIndex ? 'Saving...' : 'Save Results'}
                </button>
                <button
                  onClick={() => saveReport(report, reportIndex, 'verify')}
                  disabled={saving === reportIndex || !hasAnyValue || hasErrors}
                  className="btn-success flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" /> {saving === reportIndex ? 'Verifying...' : 'Verify & Sign'}
                </button>
              </div>
            )}

            {report.status === 'verified' && (
              <div className="mt-4 flex gap-3 justify-end flex-wrap">
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Report Verified
                </div>
                <button
                  onClick={async () => {
                    try {
                      await api.put(`/reports/${report._id}`, { status: 'delivered' });
                      toast.success('Report marked as delivered!');
                      load();
                    } catch (err) {
                      toast.error(err?.response?.data?.message || 'Error updating status');
                    }
                  }}
                  className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Mark as Delivered
                </button>
              </div>
            )}
          </div>
        );
      })}

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
