import { createReportPdfFile, getStoredLabSettings } from './pdf';

const getReportTestLabel = (report) => {
  const tests = Array.isArray(report?.tests) && report.tests.length
    ? report.tests
    : report?.test
      ? [report.test]
      : [];
  return tests.map((test) => test?.name).filter(Boolean).join(', ');
};

const buildWhatsAppMessage = (report, settings = {}) => {
  const title = settings.reportHeader || settings.labName || 'Lab Report Generated';
  return `
${title}

Patient: ${report.patient?.name}
Patient ID: ${report.patient?.patientId}
Tests: ${getReportTestLabel(report)}
Report ID: ${report.reportId}
Status: ${report.status}
Date: ${new Date(report.reportDate || Date.now()).toLocaleDateString()}
${report.remarks ? `Remarks: ${report.remarks}` : ''}
  `.trim();
};

const openWhatsAppLink = (message, phoneNumber) => {
  const encoded = encodeURIComponent(message);
  const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';
  const whatsappLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(whatsappLink, '_blank');
};

const downloadFile = (file) => {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const canShareFiles = (files) => {
  if (!navigator.share) return false;
  if (!navigator.canShare) return true;
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
};

const shareReport = async (report, phoneNumber) => {
  const settings = getStoredLabSettings();
  const message = buildWhatsAppMessage(report, settings);
  const pdfFile = await createReportPdfFile(report, {
    renderMode: 'share',
    labSettings: settings,
  });

  if (canShareFiles([pdfFile])) {
    await navigator.share({
      title: settings.reportHeader || settings.labName || report.reportId,
      text: message,
      files: [pdfFile],
    });
    return { mode: 'native-share', fileName: pdfFile.name };
  }

  downloadFile(pdfFile);
  openWhatsAppLink(message, phoneNumber);
  return { mode: 'download-fallback', fileName: pdfFile.name };
};

export const shareReportOnWhatsApp = async (report, labName = 'Lab') => {
  return shareReport(report, '');
};

export const shareMultipleReportsOnWhatsApp = (reports, labName = 'Lab') => {
  const settings = getStoredLabSettings();
  const title = settings.reportHeader || settings.labName || 'Lab Reports';
  const message = `
${title}

Reports Generated: ${reports.length}

${reports.map((report, index) => `${index + 1}. ${report.patient?.name} - ${getReportTestLabel(report)} (${report.reportId})`).join('\n')}
  `.trim();

  openWhatsAppLink(message, '');
  return { mode: 'message-only' };
};

export const shareReportViaWhatsAppNumber = async (report, phoneNumber) => {
  return shareReport(report, phoneNumber);
};

export default {
  shareReportOnWhatsApp,
  shareMultipleReportsOnWhatsApp,
  shareReportViaWhatsAppNumber,
};
