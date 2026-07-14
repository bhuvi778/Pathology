import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import ReportPrint from '../components/reports/ReportPrint';
import api from './api';

const getReportTestLabel = (report) => {
  const tests = Array.isArray(report?.tests) && report.tests.length
    ? report.tests
    : report?.test
      ? [report.test]
      : [];
  return tests.map((test) => test?.name).filter(Boolean).join(', ');
};

export const getStoredLabSettings = () => {
  try {
    return JSON.parse(localStorage.getItem('labSettings') || '{}');
  } catch {
    return {};
  }
};

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

const normalizeLabSettings = (labSettings = {}) => ({
  ...labSettings,
  doctorSignature: resolveAssetUrl(labSettings.doctorSignature),
});

const waitForImages = async (container) => {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
  }));
};

const renderReportToContainer = async (report, options = {}) => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.background = '#ffffff';
  container.style.zIndex = '-1';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(createElement(ReportPrint, {
    report,
    appointment: report?.appointment,
    renderMode: options.renderMode || 'print',
    labSettingsOverride: normalizeLabSettings(options.labSettings || getStoredLabSettings()),
  }));

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  if (document.fonts?.ready) await document.fonts.ready;
  await waitForImages(container);

  return {
    container,
    cleanup: () => {
      root.unmount();
      container.remove();
    },
  };
};

const buildPdfFromCanvas = (canvas) => {
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL('image/png');

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return pdf;
};

export const generatePDFFilename = (report) => {
  const date = new Date(report.reportDate || Date.now()).toISOString().split('T')[0];
  return `Report_${report.reportId}_${report.patient?.patientId}_${date}.pdf`;
};

export const createReportPdfBlob = async (report, options = {}) => {
  const { container, cleanup } = await renderReportToContainer(report, options);
  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: container.scrollWidth,
      height: container.scrollHeight,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
    });
    const pdf = buildPdfFromCanvas(canvas);
    return pdf.output('blob');
  } finally {
    cleanup();
  }
};

export const createReportPdfFile = async (report, options = {}) => {
  const blob = await createReportPdfBlob(report, options);
  return new File([blob], generatePDFFilename(report), { type: 'application/pdf' });
};

const triggerFileDownload = (file) => {
  const url = URL.createObjectURL(file instanceof Blob ? file : new Blob([file], { type: 'application/pdf' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name || 'report.pdf';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportReportToPDF = async (report, options = {}) => {
  try {
    const file = await createReportPdfFile(report, {
      renderMode: 'print',
      ...options,
    });
    triggerFileDownload(file);
    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return false;
  }
};

export const printReport = async (report, options = {}) => {
  const { container, cleanup } = await renderReportToContainer(report, {
    renderMode: 'print',
    ...options,
  });

  try {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      return false;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Report-${report.reportId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 10px; background: #fff; }
            @media print { body { margin: 0; padding: 10px; } }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>
          ${container.innerHTML}
          <script>
            window.print();
            setTimeout(() => window.close(), 250);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    return true;
  } catch (error) {
    console.error('Error printing report:', error);
    return false;
  } finally {
    cleanup();
  }
};

export const exportReportAsText = (report) => {
  const text = `
LABORATORY REPORT
=================

Report ID: ${report.reportId}
Report Date: ${new Date(report.reportDate).toLocaleDateString()}

PATIENT INFORMATION
-------------------
Name: ${report.patient?.name}
Patient ID: ${report.patient?.patientId}
Age: ${report.patient?.age} ${report.patient?.ageUnit}
Gender: ${report.patient?.gender}
Contact: ${report.patient?.phone}

TEST INFORMATION
----------------
Tests: ${getReportTestLabel(report)}

RESULTS
-------
${report.results?.map((result) => `${result.parameterName}: ${result.value} ${result.unit} (Normal Range: ${result.normalRange}) ${result.flag ? `[${result.flag}]` : ''}`).join('\n')}

REMARKS
-------
${report.remarks || 'No remarks'}

DOCTOR INFORMATION
------------------
Doctor: ${report.doctor?.name}
Specialty: ${report.doctor?.specialty}

STATUS: ${report.status}
Generated by: ${report.enteredBy?.name || 'N/A'}
${report.verifiedBy ? `Verified by: ${report.verifiedBy.name}` : ''}
  `.trim();

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = generatePDFFilename(report).replace('.pdf', '.txt');
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export default {
  createReportPdfBlob,
  createReportPdfFile,
  exportReportToPDF,
  exportReportAsText,
  generatePDFFilename,
  getStoredLabSettings,
  printReport,
};
