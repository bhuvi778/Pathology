import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, fmt) : '-';
};

export const formatDateTime = (date) => formatDate(date, 'dd MMM yyyy, hh:mm a');

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);

export const getStatusBadgeClass = (status) => {
  const map = {
    pending: 'badge-pending',
    sample_collected: 'badge-processing',
    processing: 'badge-processing',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    entered: 'badge-processing',
    verified: 'badge-completed',
    delivered: 'badge-completed',
    paid: 'badge-completed',
    partial: 'badge-pending',
  };
  return map[status] || 'badge-pending';
};

export const getStatusLabel = (status) => {
  const map = {
    pending: 'Pending',
    sample_collected: 'Sample Collected',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
    entered: 'Results Entered',
    verified: 'Verified',
    delivered: 'Delivered',
    paid: 'Paid',
    partial: 'Partially Paid',
  };
  return map[status] || status;
};

export const getCategoryLabel = (cat) => {
  const map = {
    hematology: 'Hematology',
    biochemistry: 'Biochemistry',
    serology: 'Serology',
    urology: 'Urology',
    microbiology: 'Microbiology',
    hormones: 'Hormones',
    radiology: 'Radiology',
    cardiology: 'Cardiology',
    other: 'Other',
  };
  return map[cat] || cat;
};

export const getFlagColor = (flag) => {
  if (flag === 'H') return 'text-red-600 font-bold';
  if (flag === 'L') return 'text-blue-600 font-bold';
  if (flag === 'C') return 'text-purple-600 font-bold';
  if (flag === 'N') return 'text-emerald-600 font-bold';
  return '';
};

export const getApplicableRange = (range = {}, gender = 'general') => {
  const normalizedGender = String(gender || 'general').toLowerCase().startsWith('m')
    ? 'male'
    : String(gender || 'general').toLowerCase().startsWith('f')
      ? 'female'
      : 'general';

  return range?.[normalizedGender] || range?.general || range?.male || range?.female || {};
};

export const formatRangeDisplay = (range = {}, gender = 'general') => {
  const selectedRange = getApplicableRange(range, gender);
  const numericRange = selectedRange?.min !== undefined && selectedRange?.max !== undefined
    ? `${selectedRange.min} - ${selectedRange.max}`
    : selectedRange?.min !== undefined
      ? `>= ${selectedRange.min}`
      : selectedRange?.max !== undefined
        ? `<= ${selectedRange.max}`
        : '';

  if (selectedRange?.text && numericRange) return `${selectedRange.text} (${numericRange})`;
  if (selectedRange?.text) return selectedRange.text;
  return numericRange;
};

export const getFlagBadgeClass = (flag) => {
  if (flag === 'H') return 'bg-red-100 text-red-600';
  if (flag === 'L') return 'bg-blue-100 text-blue-600';
  if (flag === 'C') return 'bg-purple-100 text-purple-600';
  if (flag === 'N') return 'bg-emerald-100 text-emerald-600';
  return 'bg-slate-100 text-slate-500';
};

export const getReportTests = (report) => {
  if (Array.isArray(report?.tests) && report.tests.length) return report.tests;
  if (report?.test) return [report.test];
  return [];
};

export const getReportTestNames = (report) => getReportTests(report).map((test) => test?.name).filter(Boolean);

export const getReportTestLabel = (report) => {
  const names = getReportTestNames(report);
  if (!names.length) return 'No tests assigned';
  return names.join(', ');
};

export const buildSingleTestReport = (report, selectedTestId) => {
  const selectedIds = selectedTestId ? [selectedTestId] : [];
  return buildScopedReportByTests(report, selectedIds);
};

export const buildScopedReportByTests = (report, selectedTestIds = []) => {
  if (!report || !Array.isArray(selectedTestIds) || !selectedTestIds.length) return report;

  const tests = getReportTests(report);
  const selectedIdSet = new Set(selectedTestIds.map((id) => String(id)));
  const scopedTests = tests.filter((test) => selectedIdSet.has(String(test?._id || test)));
  if (!scopedTests.length) return report;

  const filteredResults = (report.results || []).filter(
    (result) => selectedIdSet.has(String(result.test || result.testId || ''))
  );

  return {
    ...report,
    tests: scopedTests,
    test: scopedTests[0],
    results: filteredResults,
  };
};

export const groupReportResults = (report) => {
  const tests = Array.isArray(report?.tests) && report.tests.length
    ? report.tests
    : report?.test
      ? [report.test]
      : [];

  const sections = tests.map((test) => ({
    testId: test?._id || test,
    test,
    results: [],
  }));

  const sectionById = new Map(sections.map((section) => [String(section.testId), section]));

  for (const result of report?.results || []) {
    const testId = String(result.test || '');
    const existingSection = sectionById.get(testId);
    if (existingSection) {
      existingSection.results.push(result);
      continue;
    }

    const fallbackSection = {
      testId,
      test: {
        _id: result.test,
        name: result.testName,
        shortName: result.testShortName,
        sampleType: result.sampleType,
        category: result.category,
      },
      results: [result],
    };
    sectionById.set(testId, fallbackSection);
    sections.push(fallbackSection);
  }

  return sections.filter((section) => section.results.length > 0 || section.test?.name);
};

export const validateNumericResult = (value, result) => {
  if (value === '' || value === null || value === undefined) return '';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 'Enter a valid number';
  return '';
};

export const calculateFlag = (value, range, gender = 'general') => {
  if (!value || !range) return '';
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  const r = getApplicableRange(range, gender);
  if (!r) return '';
  if (r.max !== undefined && num > r.max) return 'H';
  if (r.min !== undefined && num < r.min) return 'L';
  return 'N';
};
