const STATUS_PRIORITY = {
  pending: 0,
  entered: 1,
  verified: 2,
  delivered: 3,
};

const normalizeGender = (gender) => {
  if (!gender) return 'general';
  const value = String(gender).toLowerCase();
  if (value.startsWith('m')) return 'male';
  if (value.startsWith('f')) return 'female';
  return 'general';
};

const toNumberOrUndefined = (value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getApplicableRange = (normalRange = {}, gender) => {
  const normalizedGender = normalizeGender(gender);
  return normalRange?.[normalizedGender] || normalRange?.general || normalRange?.male || normalRange?.female || {};
};

const formatRangeText = (range = {}) => {
  if (range.text) return range.text;
  const min = toNumberOrUndefined(range.min);
  const max = toNumberOrUndefined(range.max);
  if (min !== undefined && max !== undefined) return `${min} - ${max}`;
  if (min !== undefined) return `>= ${min}`;
  if (max !== undefined) return `<= ${max}`;
  return '';
};

const buildResultFromParameter = (test, parameter, existingResult = {}, gender) => {
  const applicableRange = getApplicableRange(parameter.normalRange, gender);

  return {
    test: test._id,
    testName: existingResult.testName || test.name,
    testShortName: existingResult.testShortName || test.shortName || '',
    sampleType: existingResult.sampleType || test.sampleType || '',
    category: existingResult.category || test.category || '',
    parameterName: parameter.name,
    value: existingResult.value || '',
    unit: existingResult.unit || parameter.unit || '',
    normalRange: existingResult.normalRange || formatRangeText(applicableRange),
    type: parameter.type || existingResult.type || 'numeric',
    options: Array.isArray(parameter.options) ? parameter.options : [],
    rangeMin: toNumberOrUndefined(applicableRange.min),
    rangeMax: toNumberOrUndefined(applicableRange.max),
    flag: existingResult.flag || '',
  };
};

const buildReportResults = (testsInput, existingResults = [], gender) => {
  const tests = Array.isArray(testsInput) ? testsInput : testsInput ? [testsInput] : [];
  const existingByKey = new Map(
    (Array.isArray(existingResults) ? existingResults : []).map((result) => {
      const testId = String(result.test || result.testId || '');
      return [`${testId}::${result.parameterName}`, result];
    })
  );

  return tests.flatMap((test) => {
    const parameters = Array.isArray(test?.parameters) ? test.parameters : [];
    return parameters.map((parameter) => {
      const key = `${String(test._id)}::${parameter.name}`;
      return buildResultFromParameter(test, parameter, existingByKey.get(key), gender);
    });
  });
};

const getOverallStatus = (statuses = []) => {
  if (!statuses.length) return 'pending';
  return statuses.reduce((current, status) => {
    const currentPriority = STATUS_PRIORITY[current] ?? 0;
    const nextPriority = STATUS_PRIORITY[status] ?? 0;
    return nextPriority < currentPriority ? status : current;
  }, statuses[0]);
};

const mergeReportsByAppointment = (reports, gender) => {
  const grouped = new Map();

  for (const report of reports || []) {
    const appointmentId = String(report.appointment?._id || report.appointment || report._id);
    const current = grouped.get(appointmentId);
    const reportTests = Array.isArray(report.tests) && report.tests.length
      ? report.tests
      : report.test
        ? [report.test]
        : [];

    if (!current) {
      grouped.set(appointmentId, {
        _id: report._id,
        reportId: report.reportId,
        appointment: report.appointment,
        patient: report.patient,
        doctor: report.doctor,
        tests: [...reportTests],
        results: Array.isArray(report.results) ? [...report.results] : [],
        remarks: report.remarks || '',
        status: report.status,
        enteredBy: report.enteredBy,
        verifiedBy: report.verifiedBy,
        reportDate: report.reportDate,
        verifiedAt: report.verifiedAt,
        deliveredAt: report.deliveredAt,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        legacyReportIds: [report._id],
      });
      continue;
    }

    const seenTests = new Set(current.tests.map((test) => String(test?._id || test)));
    for (const test of reportTests) {
      const testId = String(test?._id || test);
      if (!seenTests.has(testId)) {
        current.tests.push(test);
        seenTests.add(testId);
      }
    }

    current.results.push(...(Array.isArray(report.results) ? report.results : []));
    current.remarks = [current.remarks, report.remarks].filter(Boolean).join('\n');
    current.status = getOverallStatus([current.status, report.status]);
    current.enteredBy = current.enteredBy || report.enteredBy;
    current.verifiedBy = current.verifiedBy || report.verifiedBy;
    current.reportDate = current.reportDate || report.reportDate;
    current.verifiedAt = current.verifiedAt || report.verifiedAt;
    current.deliveredAt = current.deliveredAt || report.deliveredAt;
    current.updatedAt = report.updatedAt > current.updatedAt ? report.updatedAt : current.updatedAt;
    current.legacyReportIds.push(report._id);
  }

  return Array.from(grouped.values()).map((report) => ({
    ...report,
    results: report.results.sort((left, right) => {
      const leftTest = `${left.testName || ''} ${left.parameterName || ''}`;
      const rightTest = `${right.testName || ''} ${right.parameterName || ''}`;
      return leftTest.localeCompare(rightTest);
    }),
  }));
};

const validateReportResults = (results = []) => {
  for (const result of results) {
    if (result.type !== 'numeric' || result.value === '' || result.value === null || result.value === undefined) {
      continue;
    }

    const numericValue = Number(result.value);
    if (!Number.isFinite(numericValue)) {
      return `${result.parameterName} must be a valid number.`;
    }
    if (result.rangeMin !== undefined && numericValue < result.rangeMin) {
      return `${result.parameterName} must be at least ${result.rangeMin}.`;
    }
    if (result.rangeMax !== undefined && numericValue > result.rangeMax) {
      return `${result.parameterName} must be at most ${result.rangeMax}.`;
    }
  }

  return null;
};

module.exports = {
  buildReportResults,
  formatRangeText,
  getApplicableRange,
  getOverallStatus,
  mergeReportsByAppointment,
  normalizeGender,
  validateReportResults,
};
