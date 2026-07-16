import { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { formatDate, getReportTestLabel, groupReportResults } from '../../utils/helpers';

const SCREEN_BREAKPOINT = 640;

function getResultValueStyle(flag) {
  if (flag === 'H') return { color: '#000000', fontWeight: '700' };
  return { color: '#111827', fontWeight: '400' };
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

const normalizeText = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const getResponsiveMode = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= SCREEN_BREAKPOINT;
};

const isSerumUricAcidClassicReport = (groupedResults = []) => {
  if (groupedResults.length !== 1) return false;
  const section = groupedResults[0] || {};
  const testName = normalizeText(section?.test?.name);
  return testName === 'serum uric acid';
};

const isCbcClassicReport = (groupedResults = []) => {
  if (groupedResults.length !== 1) return false;
  const section = groupedResults[0] || {};
  const testName = normalizeText(section?.test?.name);
  const shortName = normalizeText(section?.test?.shortName);

  return [testName, shortName].some((value) => (
    value === 'cbc'
    || value.includes('complete blood count')
    || value.includes('complete blood picture')
    || value.includes('general blood picture')
  ));
};

const findResultByNames = (results = [], aliases = []) => {
  const normalizedAliases = aliases.map(normalizeText);
  return results.find((result) => normalizedAliases.includes(normalizeText(result?.parameterName)));
};

const splitLines = (value) => String(value || '')
  .split(/\r?\n|•|\u2022|;/)
  .map((line) => line.trim())
  .filter(Boolean);

const formatClassicValue = (result, fallback = '-') => {
  if (!result?.value) return fallback;
  return result.unit ? `${result.value} ${result.unit}` : result.value;
};

const getClassicValueStyle = (flag) => (
  flag === 'H'
    ? { color: '#000000', fontWeight: '700' }
    : { color: '#111827', fontWeight: '400' }
);

function CbcClassicPrint({ report, patient, section, renderMode }) {
  const isPrintLike = renderMode === 'print' || renderMode === 'share';
  const isMobile = !isPrintLike && getResponsiveMode();
  const reportDate = formatDate(report?.reportDate || new Date(), 'dd/MM/yyyy');
  const registeredDate = formatDate(report?.appointment?.appointmentDate || report?.reportDate || new Date(), 'dd/MM/yyyy');
  const results = section?.results || [];
  const plateletResult = findResultByNames(results, ['Platelet Count', 'Platelets', 'Platelet']);
  const wbcResult = findResultByNames(results, ['Total WBC Count', 'WBC Count', 'WBC']);
  const plateletRemarksResult = findResultByNames(results, ['Platelet Remarks', 'Platelet Comment', 'Platelet Morphology']);
  const rbcRemarkResult = findResultByNames(results, ['RBC', 'RBC Remarks', 'RBC Morphology', 'Red Cell Morphology']);
  const haemoparasitesResult = findResultByNames(results, ['Haemoparasites', 'Hemoparasites', 'MP', 'Malarial Parasite']);
  const opinionResult = findResultByNames(results, ['Opinion', 'Impression']);
  const neutrophilsResult = findResultByNames(results, ['Neutrophils', 'Polymorphs']);
  const lymphocytesResult = findResultByNames(results, ['Lymphocytes']);
  const eosinophilsResult = findResultByNames(results, ['Eosinophils']);
  const monocytesResult = findResultByNames(results, ['Monocytes']);
  const basophilsResult = findResultByNames(results, ['Basophils']);

  const rbcLines = splitLines(rbcRemarkResult?.value);
  const plateletRemarkLines = splitLines(plateletRemarksResult?.value);
  const topPadding = isPrintLike ? '5cm' : isMobile ? '16px' : '32px';
  const outerPadding = isMobile ? '12px' : '18px 20px';
  const labelColumnWidth = isMobile ? '100%' : '1fr 1fr 120px';

  const detailRow = (label, content, options = {}) => (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '4px' : '8px', marginTop: options.noMargin ? 0 : '10px' }}>
      <span style={{ minWidth: isMobile ? 'auto' : options.labelWidth || '130px', fontWeight: '700' }}>{label}</span>
      <span style={{ flex: 1 }}>{content || '-'}</span>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: isMobile ? '11px' : '12px', color: '#000', padding: outerPadding, paddingTop: topPadding, maxWidth: '860px', margin: '0 auto', backgroundColor: '#fff' }}>
      <div style={{ border: '1px solid #d1d5db' }}>
        <div style={{ display: 'grid', gridTemplateColumns: labelColumnWidth, gap: '12px', padding: isMobile ? '12px' : '14px 16px', borderBottom: '1px solid #d1d5db' }}>
          <div>
            <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '700', letterSpacing: '0.3px' }}>{patient?.name || 'Patient'}</div>
            <div style={{ marginTop: '4px' }}>Age / Sex : {patient?.age} {patient?.ageUnit || 'YRS'} / {String(patient?.gender || '').toUpperCase()}</div>
            <div style={{ marginTop: '3px' }}>Referred by : {report?.doctor?.name || '-'}</div>
            <div style={{ marginTop: '3px' }}>Reg. no. : <strong>{patient?.patientId || '-'}</strong></div>
          </div>

          <div style={{ paddingLeft: isMobile ? 0 : '8px', borderLeft: isMobile ? 'none' : '1px solid #e5e7eb', borderTop: isMobile ? '1px solid #e5e7eb' : 'none', paddingTop: isMobile ? '10px' : 0 }}>
            <div style={{ fontFamily: 'monospace', fontWeight: '700', letterSpacing: '2px', marginBottom: '8px' }}>{report?.reportId || '-'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '92px 1fr', rowGap: '3px', columnGap: '6px' }}>
              <span>Registered on{isMobile ? `: ${registeredDate}` : ''}</span>{!isMobile && <span>: {registeredDate}</span>}
              <span>Reported on{isMobile ? `: ${reportDate}` : ''}</span>{!isMobile && <span>: {reportDate}</span>}
            </div>
          </div>

          {!isMobile && (
            <div style={{ border: '1px solid #d1d5db', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '11px' }}>
              QR
            </div>
          )}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ borderBottom: '1px solid #d1d5db', padding: isMobile ? '10px 12px' : '12px 14px', verticalAlign: 'top' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 90px 110px 120px', gap: '8px', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontWeight: '700' }}>{String(plateletResult?.parameterName || 'PLATELET COUNT').toUpperCase()}</div>
                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#374151' }}>Method: Electrical Impedance & Microscopy</div>
                    <div style={{ marginTop: '2px', fontSize: '11px', color: '#374151' }}>Instrument: Microscopy/Hematology Analyser</div>
                  </div>
                  <div style={{ textAlign: isMobile ? 'left' : 'center', ...getClassicValueStyle(plateletResult?.flag) }}>{plateletResult?.value || '-'}</div>
                  <div style={{ textAlign: isMobile ? 'left' : 'center' }}>{plateletResult?.unit || 'lakhs/cumm'}</div>
                  <div style={{ textAlign: isMobile ? 'left' : 'center' }}>{plateletResult?.normalRange || '1.5 - 4.5'}</div>
                </div>
                {plateletRemarkLines.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '6px' }}>
                    <span style={{ fontStyle: 'italic', fontWeight: '700' }}>Remarks:</span>
                    <span style={{ fontStyle: 'italic', fontWeight: '600' }}>{plateletRemarkLines.join(' ')}</span>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ borderTop: '1px solid #d1d5db', padding: isMobile ? '12px' : '14px 16px' }}>
          <div style={{ textAlign: 'center', fontWeight: '700', marginBottom: '12px' }}>GENERAL BLOOD PICTURE</div>

          {detailRow('RBC', (
            rbcLines.length > 0 ? (
              <div>
                {rbcLines.map((line) => (
                  <div key={line} style={{ marginBottom: '4px' }}>- {line}</div>
                ))}
              </div>
            ) : '—'
          ), { noMargin: true, labelWidth: '48px' })}

          {detailRow('WBC', <span style={getClassicValueStyle(wbcResult?.flag)}>{formatClassicValue(wbcResult)}</span>, { labelWidth: '48px' })}

          <div style={{ marginTop: '10px' }}>
            <div style={{ fontWeight: '700', marginBottom: '6px' }}>DLC</div>
            <div style={{ paddingLeft: isMobile ? 0 : '30px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 200px))', rowGap: '4px', columnGap: '18px' }}>
              <div>Polymorphs - {neutrophilsResult?.value || '-'}</div>
              <div>Lymphocytes - {lymphocytesResult?.value || '-'}</div>
              <div>Eosinophils - {eosinophilsResult?.value || '-'}</div>
              <div>Monocytes - {monocytesResult?.value || '-'}</div>
              <div>Basophils - {basophilsResult?.value || '-'}</div>
            </div>
          </div>

          {detailRow('PLATELETS', <span style={getClassicValueStyle(plateletResult?.flag)}>{formatClassicValue(plateletResult)}</span>, { labelWidth: '88px' })}
          {detailRow('HAEMOPARASITES', haemoparasitesResult?.value || 'Not seen', { labelWidth: '132px' })}
          {detailRow('OPINION', opinionResult?.value || report?.remarks || '-', { labelWidth: '88px' })}
        </div>
      </div>
    </div>
  );
}

function SerumUricAcidClassicPrint({ report, patient, section }) {
  const firstResult = section?.results?.[0] || {};
  const reportDate = formatDate(report?.reportDate || new Date(), 'dd/MM/yyyy');
  const registeredDate = formatDate(report?.appointment?.appointmentDate || report?.reportDate || new Date(), 'dd/MM/yyyy');
  const receivedDate = formatDate(report?.reportDate || new Date(), 'dd/MM/yyyy');

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#000', padding: '18px 20px', paddingTop: '5cm', maxWidth: '860px', margin: '0 auto', backgroundColor: '#fff' }}>
      <div style={{ border: '1px solid #d1d5db' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '12px', padding: '14px 16px', borderBottom: '1px solid #d1d5db' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.3px' }}>{patient?.name || 'Patient'}</div>
            <div style={{ marginTop: '4px', fontSize: '12px' }}>Age / Sex &nbsp;&nbsp; : {patient?.age} YRS / {String(patient?.gender || '').toUpperCase()}</div>
            <div style={{ marginTop: '3px', fontSize: '12px' }}>Referred by &nbsp; : {report?.doctor?.name || '-'}</div>
            <div style={{ marginTop: '3px', fontSize: '12px' }}>Reg. no. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : <strong>{patient?.patientId || '-'}</strong></div>
          </div>

          <div style={{ paddingLeft: '8px', borderLeft: '1px solid #e5e7eb' }}>
            <div style={{ fontFamily: 'monospace', fontWeight: '700', letterSpacing: '2px', marginBottom: '8px' }}>{report?.reportId || '-'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr', rowGap: '3px', fontSize: '12px' }}>
              <span>Registered on</span><span>: {registeredDate}</span>
              <span>Received on</span><span>: {receivedDate}</span>
              <span>Reported on</span><span>: {reportDate}</span>
            </div>
          </div>

          <div style={{ border: '1px solid #d1d5db', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '11px' }}>
            QR
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #d1d5db', fontWeight: '700', letterSpacing: '0.8px' }}>* BIOCHEMISTRY</div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #d1d5db', borderRight: '1px solid #e5e7eb', padding: '8px', textAlign: 'left', width: '45%' }}>TEST</th>
              <th style={{ borderBottom: '1px solid #d1d5db', borderRight: '1px solid #e5e7eb', padding: '8px', textAlign: 'center', width: '15%' }}>VALUE</th>
              <th style={{ borderBottom: '1px solid #d1d5db', borderRight: '1px solid #e5e7eb', padding: '8px', textAlign: 'center', width: '15%' }}>UNIT</th>
              <th style={{ borderBottom: '1px solid #d1d5db', padding: '8px', textAlign: 'center', width: '25%' }}>REFERENCE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', padding: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.5px' }}>{String(firstResult.parameterName || section?.test?.name || 'SERUM URIC ACID').toUpperCase()}</div>
                <div style={{ marginTop: '5px', color: '#4b5563', fontSize: '11px' }}>Method: Uricase</div>
                <div style={{ marginTop: '2px', color: '#4b5563', fontSize: '11px' }}>Instrument: Biochemistry Analyser</div>
              </td>
              <td style={{ borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', padding: '8px', textAlign: 'center', ...getClassicValueStyle(firstResult.flag) }}>{firstResult.value || '-'}</td>
              <td style={{ borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{firstResult.unit || 'mg/dl'}</td>
              <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>{firstResult.normalRange || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '11px', color: '#4b5563' }}>---- End of report ----</div>
    </div>
  );
}

export default function ReportPrint({ report, appointment, renderMode = 'print', labSettingsOverride }) {
  const patient = report?.patient || appointment?.patient;
  const groupedResults = groupReportResults(report);
  const [isMobileScreen, setIsMobileScreen] = useState(() => renderMode === 'screen' && getResponsiveMode());
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

  useEffect(() => {
    if (renderMode !== 'screen') {
      setIsMobileScreen(false);
      return undefined;
    }

    const handleResize = () => setIsMobileScreen(getResponsiveMode());
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderMode]);

  const resolvedSettings = useMemo(() => ({
    ...labSettings,
    doctorSignature: resolveAssetUrl(labSettings.doctorSignature),
  }), [labSettings]);

  const isShareMode = renderMode === 'share';
  const isPrintMode = renderMode === 'print';
  const isScreenMode = renderMode === 'screen';
  const isCompactScreen = isScreenMode && isMobileScreen;
  const includeHeader = isShareMode && Boolean(resolvedSettings.reportHeader || resolvedSettings.labName);
  const includeFooter = resolvedSettings.includeFooter !== false;
  const showSignature = isShareMode && Boolean(resolvedSettings.doctorSignature);
  const reportLayout = resolvedSettings.reportLayout || 'standard';
  const padding = isCompactScreen ? 12 : reportLayout === 'compact' ? 12 : 20;
  const fontSize = isCompactScreen ? 11 : reportLayout === 'compact' ? 11 : 12;
  const topPadding = isPrintMode ? '5cm' : isShareMode ? '32px' : isCompactScreen ? '12px' : '24px';
  const isPlainResultLayout = renderMode === 'print' || renderMode === 'share';
  const sectionDividerColor = isPrintMode ? '#9ca3af' : '#111827';

  if (isPrintMode && isSerumUricAcidClassicReport(groupedResults)) {
    return <SerumUricAcidClassicPrint report={report} patient={patient} section={groupedResults[0]} />;
  }

  if ((isPrintMode || isShareMode || isScreenMode) && isCbcClassicReport(groupedResults)) {
    return <CbcClassicPrint report={report} patient={patient} section={groupedResults[0]} renderMode={renderMode} />;
  }

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

      <div style={{ display: 'grid', gridTemplateColumns: isCompactScreen ? '1fr' : '1fr 1fr', gap: '8px', marginBottom: '16px', padding: isPlainResultLayout ? '0 0 8px' : '10px 12px', backgroundColor: isPlainResultLayout ? 'transparent' : '#f8fafc', border: isPlainResultLayout ? 'none' : '1px solid #e2e8f0', borderBottom: isPrintMode ? '1px solid #d1d5db' : 'none', borderRadius: '6px' }}>
        <div style={{ display: 'flex', flexDirection: isCompactScreen ? 'column' : 'row', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '90px' }}>Patient:</span>
          <span>{patient?.name}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: isCompactScreen ? 'column' : 'row', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '90px' }}>Patient ID:</span>
          <span>{patient?.patientId}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: isCompactScreen ? 'column' : 'row', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '90px' }}>IP Number:</span>
          <span>{patient?.ipNumber || 'N/A'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: isCompactScreen ? 'column' : 'row', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '90px' }}>Age/Gender:</span>
          <span>{patient?.age} {patient?.ageUnit} / {patient?.gender}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: isCompactScreen ? 'column' : 'row', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '90px' }}>Blood Group:</span>
          <span>{patient?.bloodGroup || 'N/A'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: isCompactScreen ? 'column' : 'row', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '90px' }}>Report Date:</span>
          <span>{formatDate(report?.reportDate || new Date(), 'dd/MM/yyyy')}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: isCompactScreen ? 'column' : 'row', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '90px' }}>Report ID:</span>
          <span style={{ fontFamily: 'monospace' }}>{report?.reportId}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: isCompactScreen ? 'column' : 'row', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#374151', minWidth: '90px' }}>Tests:</span>
          <span>{getReportTestLabel(report)}</span>
        </div>
      </div>

      {groupedResults.length > 0 ? groupedResults.map((section) => (
        <div key={String(section.test?._id || section.testId)} style={{ marginBottom: '18px' }}>
          <div style={{ marginBottom: '8px', padding: isPlainResultLayout ? '0 0 4px' : '8px 10px', backgroundColor: isPlainResultLayout ? 'transparent' : '#e2e8f0', borderRadius: '6px', borderBottom: isPlainResultLayout ? `1px solid ${sectionDividerColor}` : 'none', fontWeight: '700', color: '#111827' }}>
            {section.test?.name}
            <span style={{ fontWeight: '400', marginLeft: '8px', color: '#475569', fontSize: '11px' }}>
              {section.test?.sampleType || 'Sample not set'}
            </span>
          </div>
          <div style={{ overflowX: isCompactScreen ? 'auto' : 'visible' }}>
          <table style={{ width: '100%', minWidth: isCompactScreen ? '500px' : '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: 'transparent', color: '#111827', borderBottom: isPlainResultLayout ? '1px solid #9ca3af' : '1px solid #e5e7eb' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', fontSize: '11px' }}>Parameter</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: '700', fontSize: '11px', width: '82px' }}>Result</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: '700', fontSize: '11px', width: '70px' }}>Unit</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: '700', fontSize: '11px', width: '132px' }}>Reference Range</th>
              </tr>
            </thead>
            <tbody>
              {section.results.map((result, index) => (
                <tr key={`${String(result.test || '')}-${result.parameterName}`} style={{ backgroundColor: 'transparent', borderBottom: isPlainResultLayout ? 'none' : '1px solid #e2e8f0' }}>
                  <td style={{ padding: '7px 10px', fontWeight: '500' }}>{result.parameterName}</td>
                  <td style={{ padding: '7px 6px', textAlign: 'center', fontSize: '13px', ...getResultValueStyle(result.flag) }}>
                    {result.value || '—'}
                  </td>
                  <td style={{ padding: '7px 6px', textAlign: 'center', color: '#6b7280', fontSize: '11px' }}>{result.unit || '—'}</td>
                  <td style={{ padding: '7px 6px', textAlign: 'center', color: '#6b7280', fontSize: '11px' }}>{result.normalRange || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )) : (
        <p style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No results</p>
      )}

      {report?.remarks && (
        <div style={{ marginBottom: '16px', padding: '10px 12px', backgroundColor: isPrintMode ? 'transparent' : '#fefce8', border: isPrintMode ? '1px solid #d1d5db' : '1px solid #fef08a', borderRadius: '6px' }}>
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
