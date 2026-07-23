import { createReportPdfFile, getStoredLabSettings } from './pdf';
import { createBillPdfFile } from './billPdf';

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

const buildBillWhatsAppMessage = (bill, settings = {}) => {
  const title = settings.reportHeader || settings.labName || 'Lab Bill';
  return `
${title}

Patient: ${bill?.patient?.name || '-'}
Patient ID: ${bill?.patient?.patientId || '-'}
Bill ID: ${bill?.billId || '-'}
Total: ${bill?.total ?? '-'}
Paid: ${bill?.paidAmount ?? '-'}
Balance: ${bill?.balance ?? '-'}
Status: ${bill?.paymentStatus || '-'}
Date: ${new Date(bill?.createdAt || Date.now()).toLocaleDateString()}
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

const shareReport = async (report, phoneNumber, options = {}) => {
  const settings = getStoredLabSettings();
  const message = buildWhatsAppMessage(report, settings);
  const reportsForPdf = Array.isArray(options.reports) && options.reports.length ? options.reports : report;
  const pdfFile = await createReportPdfFile(reportsForPdf, {
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

const shareBill = async (bill, phoneNumber) => {
  const settings = getStoredLabSettings();
  const message = buildBillWhatsAppMessage(bill, settings);
  const pdfFile = await createBillPdfFile(bill, {
    renderMode: 'share',
    labSettings: settings,
  });

  if (canShareFiles([pdfFile])) {
    await navigator.share({
      title: settings.reportHeader || settings.labName || bill?.billId,
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

export const shareReportViaWhatsAppNumber = async (report, phoneNumber, options = {}) => {
  return shareReport(report, phoneNumber, options);
};

export const shareBillViaWhatsAppNumber = async (bill, phoneNumber) => {
  return shareBill(bill, phoneNumber);
};

export default {
  shareReportOnWhatsApp,
  shareMultipleReportsOnWhatsApp,
  shareReportViaWhatsAppNumber,
  shareBillViaWhatsAppNumber,
};
