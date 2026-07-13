import { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { formatDate, getReportTestLabel, groupReportResults } from '../../utils/helpers';

function getFlagDisplay(flag) {
  if (flag === 'H') return <span style={{ color: '#dc2626', fontWeight: 'bold' }}>H</span>;
  if (flag === 'L') return <span style={{ color: '#2563eb', fontWeight: 'bold' }}>L</span>;
  if (flag === 'C') return <span style={{ color: '#7c3aed', fontWeight: 'bold' }}>C</span>;
  if (flag === 'N') return <span style={{ color: '#059669', fontWeight: 'bold' }}>N</span>;
  return null;
}

const resolveAssetUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;

  const baseUrl = api.defaults.baseURL || '/api';
  const root = /^https?:\/\//i.test(baseUrl)
    ? baseUrl.replace(/\/api\/?$/, '')
    : window.location.origin;

  try {
    return new URL(url, root).toString();
  } catch {
    return url;
  }
};

export default function ReportPrint({ report, appointment, renderMode = 'print', labSettingsOverride }) {
  const patient = report?.patient || appointment?.patient;
  const groupedResults = groupReportResults(report);
  const [labSettings, setLabSettings] = useState(() => {
    if (labSettingsOverride) return labSettingsOverride;
    try {
      return JSON.parse(localStorage.getItem('labSettings') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (labSettingsOverride) {
      setLabSettings(labSettingsOverride);
      return;
    }

    api.get('/settings').then((res) => {
      setLabSettings(res.data);
      localStorage.setItem('labSettings', JSON.stringify(res.data));
    }).catch(() => {});
  }, [labSettingsOverride]);

  const resolvedSettings = useMemo(() => ({
    ...labSettings,
    doctorSignature: resolveAssetUrl(labSettings.doctorSignature),
  }), [labSettings]);

  const isShareMode = renderMode === 'share';
  const includeHeader = isShareMode && Boolean(resolvedSettings.reportHeader || resolvedSettings.labName);
  const includeFooter = resolvedSettings.includeFooter !== false;
  const showSignature = isShareMode && Boolean(resolvedSettings.doctorSignature);
  const reportLayout = resolvedSettings.reportLayout || 'standard';
  const padding = reportLayout === 'compact' ? 12 : 20;
  const fontSize = reportLayout === 'compact' ? 11 : 12;
  const topPadding = isShareMode ? '32px' : '5cm';

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: `${fontSize}px`, color: '#000', padding: `${padding}px`, paddingTop: topPadding, maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff' }}>
      {includeHeader && (
        <div style={{ marginBottom: '16px', textAlign: 'center', borderBottom: '2px solid #1d4ed8', paddingBottom: '12px' }}>
          <div style={{ fontSize: `${reportLayout === 'compact' ? 18 : 20}px`, fontWeight: '700', color: '#0f172a' }}>
            {resolvedSettings.labName || 'Laboratory Report'}
          </div>
          {resolvedSettings.reportHeader && (
            <div style={{ fontSize: '13px', marginTop: '6px', color: '#1d4ed8', fontWeight: '600' }}>
              {resolvedSettings.reportHeader}
            </div>
          )}
          {(resolvedSettings.labAddress || resolvedSettings.labPhone || resolvedSettings.labEmail) && (
            <div style={{ marginTop: '8px', color: '#475569', fontSize: '11px', lineHeight: 1.5 }}>
              {resolvedSettings.labAddress && <div>{resolvedSettings.labAddress}</div>}
              <div>
                {[resolvedSettings.labPhone, resolvedSettings.labEmail].filter(Boolean).join(' | ')}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', padding: '10px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '90px' }}>Patient:</span>
          <span>{patient?.name}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '90px' }}>Patient ID:</span>
          <span>{patient?.patientId}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '90px' }}>IP Number:</span>
          <span>{patient?.ipNumber || 'N/A'}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '90px' }}>Age/Gender:</span>
          <span>{patient?.age} {patient?.ageUnit} / {patient?.gender}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '90px' }}>Blood Group:</span>
          <span>{patient?.bloodGroup || 'N/A'}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '90px' }}>Report Date:</span>
          <span>{formatDate(report?.reportDate || new Date(), 'dd/MM/yyyy')}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '90px' }}>Report ID:</span>
          <span style={{ fontFamily: 'monospace' }}>{report?.reportId}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '90px' }}>Tests:</span>
          <span>{getReportTestLabel(report)}</span>
        </div>
      </div>

      {groupedResults.length > 0 ? groupedResults.map((section) => (
        <div key={String(section.test?._id || section.testId)} style={{ marginBottom: '18px' }}>
          <div style={{ marginBottom: '8px', padding: '8px 10px', backgroundColor: '#e2e8f0', borderRadius: '6px', fontWeight: '700', color: '#1e293b' }}>
            {section.test?.name}
            <span style={{ fontWeight: '400', marginLeft: '8px', color: '#475569', fontSize: '11px' }}>
              {section.test?.sampleType || 'Sample not set'}
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#2563eb', color: '#fff' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 'bold', fontSize: '11px' }}>Parameter</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', width: '100px' }}>Result</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', width: '80px' }}>Unit</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', width: '160px' }}>Reference Range</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', width: '50px' }}>Flag</th>
              </tr>
            </thead>
            <tbody>
              {section.results.map((result, index) => (
                <tr key={`${String(result.test || '')}-${result.parameterName}`} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '7px 10px', fontWeight: '500' }}>{result.parameterName}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px', color: result.flag === 'H' ? '#dc2626' : result.flag === 'L' ? '#2563eb' : result.flag === 'N' ? '#059669' : '#000' }}>
                    {result.value || '—'}
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'center', color: '#6b7280', fontSize: '11px' }}>{result.unit || '—'}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'center', color: '#6b7280', fontSize: '11px' }}>{result.normalRange || '—'}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'center' }}>{getFlagDisplay(result.flag)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )) : (
        <p style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No results</p>
      )}

      {report?.remarks && (
        <div style={{ marginBottom: '16px', padding: '10px 12px', backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '6px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4px', color: '#713f12' }}>Remarks:</p>
          <p style={{ color: '#374151', whiteSpace: 'pre-line' }}>{report.remarks}</p>
        </div>
      )}

      {showSignature && (
        <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'center', minWidth: '220px' }}>
            <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <img src={resolvedSettings.doctorSignature} alt="Doctor Signature" style={{ maxHeight: '56px', maxWidth: '180px', objectFit: 'contain' }} />
            </div>
            <div style={{ borderTop: '1px solid #94a3b8', marginTop: '6px', paddingTop: '6px', color: '#0f172a', fontWeight: '600' }}>
              {resolvedSettings.labDirector || report?.doctor?.name || 'Authorized Signatory'}
            </div>
            {resolvedSettings.labDirectorQualification && (
              <div style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>
                {resolvedSettings.labDirectorQualification}
              </div>
            )}
          </div>
        </div>
      )}

      {includeFooter && resolvedSettings.reportFooter && (
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', color: '#475569', fontSize: `${fontSize - 1}px`, lineHeight: 1.5, marginTop: '18px' }}>
          {resolvedSettings.reportFooter}
        </div>
      )}
    </div>
  );
}
