import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';

function getFlagDisplay(flag) {
  if (flag === 'H') return <span style={{ color: '#dc2626', fontWeight: 'bold' }}>H</span>;
  if (flag === 'L') return <span style={{ color: '#2563eb', fontWeight: 'bold' }}>L</span>;
  if (flag === 'C') return <span style={{ color: '#7c3aed', fontWeight: 'bold' }}>C</span>;
  return null;
}

export default function ReportPrint({ report, appointment }) {
  const patient = report?.patient || appointment?.patient;
  const [labSettings, setLabSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('labSettings') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    api.get('/settings').then((res) => {
      setLabSettings(res.data);
      localStorage.setItem('labSettings', JSON.stringify(res.data));
    }).catch(() => {});
  }, []);

  const labDirector = labSettings.labDirector || 'Dr. Rajesh Kumar Sharma';
  const labDirectorQual = labSettings.labDirectorQualification || 'MBBS, MCPS (Pathology)';
  const includeHeader = labSettings.includeHeader !== false;
  const includeFooter = labSettings.includeFooter !== false;
  const reportLayout = labSettings.reportLayout || 'standard';
  const padding = reportLayout === 'compact' ? 12 : 20;
  const fontSize = reportLayout === 'compact' ? 11 : 12;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: `${fontSize}px`, color: '#000', padding: `${padding}px`, paddingTop: '160px', maxWidth: '800px', margin: '0 auto' }}>
      {includeHeader && labSettings.reportHeader && (
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: `${reportLayout === 'compact' ? 14 : 16}px`, fontWeight: '700', color: '#1f2937' }}>
            {labSettings.reportHeader}
          </div>
        </div>
      )}

      {/* Patient Info */}
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
          <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '90px' }}>Sample:</span>
          <span>{report?.test?.sampleType}</span>
        </div>
      </div>

      {/* Results Table */}
      {report?.results?.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
          <thead>
            <tr style={{ backgroundColor: '#2563eb', color: '#fff' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 'bold', fontSize: '11px' }}>Parameter</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', width: '100px' }}>Result</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', width: '80px' }}>Unit</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', width: '140px' }}>Reference Range</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', width: '50px' }}>Flag</th>
            </tr>
          </thead>
          <tbody>
            {report.results.map((res, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '7px 10px', fontWeight: '500' }}>{res.parameterName}</td>
                <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px', color: res.flag === 'H' ? '#dc2626' : res.flag === 'L' ? '#2563eb' : '#000' }}>
                  {res.value || '—'}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'center', color: '#6b7280', fontSize: '11px' }}>{res.unit}</td>
                <td style={{ padding: '7px 10px', textAlign: 'center', color: '#6b7280', fontSize: '11px' }}>{res.normalRange}</td>
                <td style={{ padding: '7px 10px', textAlign: 'center' }}>{getFlagDisplay(res.flag)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No results</p>
      )}

      {/* Remarks */}
      {report?.remarks && (
        <div style={{ marginBottom: '16px', padding: '10px 12px', backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '6px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4px', color: '#713f12' }}>Remarks:</p>
          <p style={{ color: '#374151' }}>{report.remarks}</p>
        </div>
      )}

      {includeFooter && labSettings.reportFooter && (
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', color: '#475569', fontSize: `${fontSize - 1}px`, lineHeight: 1.5 }}>
          {labSettings.reportFooter}
        </div>
      )}

    </div>
  );
}
