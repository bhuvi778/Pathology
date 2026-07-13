const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Test = require('../models/Test');
const Patient = require('../models/Patient');
const { protect } = require('../middleware/auth');
const {
  buildReportResults,
  mergeReportsByAppointment,
  validateReportResults,
} = require('../utils/reportResults');

const reportPopulate = [
  { path: 'patient', select: 'name patientId age ageUnit gender bloodGroup phone ipNumber' },
  {
    path: 'test',
    select: 'name shortName category sampleType parameters',
  },
  {
    path: 'tests',
    select: 'name shortName category sampleType parameters',
  },
  { path: 'doctor', select: 'name specialty qualifications pmcNumber' },
  { path: 'appointment', select: 'appointmentId appointmentDate status' },
  { path: 'enteredBy', select: 'name' },
  { path: 'verifiedBy', select: 'name' },
];

const getReportTestIds = (report) => {
  if (Array.isArray(report.tests) && report.tests.length) {
    return report.tests.map((test) => test?._id || test);
  }
  return report.test ? [report.test?._id || report.test] : [];
};

const fetchTestsForReport = async (report) => {
  const existingTests = Array.isArray(report.tests) && report.tests.length
    ? report.tests.filter((test) => test && typeof test === 'object' && test.parameters)
    : [];

  const missingIds = getReportTestIds(report).filter((testId) => {
    const id = String(testId);
    return !existingTests.some((test) => String(test._id) === id);
  });

  if (!missingIds.length) {
    return existingTests;
  }

  const fetchedTests = await Test.find({ _id: { $in: missingIds } }).select('name shortName category sampleType parameters');
  const byId = new Map(fetchedTests.map((test) => [String(test._id), test]));

  return getReportTestIds(report)
    .map((testId) => {
      const populated = existingTests.find((test) => String(test._id) === String(testId));
      return populated || byId.get(String(testId));
    })
    .filter(Boolean);
};

const normalizeReport = async (report) => {
  const reportObject = typeof report.toObject === 'function' ? report.toObject() : { ...report };
  const tests = await fetchTestsForReport(reportObject);
  const gender = reportObject.patient?.gender;

  return {
    ...reportObject,
    tests,
    results: buildReportResults(tests, reportObject.results, gender),
  };
};

const loadMergedReports = async (query) => {
  const rawReports = await Report.find(query)
    .populate(reportPopulate)
    .sort({ createdAt: -1 });

  const mergedReports = mergeReportsByAppointment(rawReports.map((report) => report.toObject()));
  return Promise.all(mergedReports.map(normalizeReport));
};

router.get('/', protect, async (req, res) => {
  try {
    const { appointment, patient, status, doctor, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (appointment) query.appointment = appointment;
    if (patient) query.patient = patient;
    if (doctor) query.doctor = doctor;
    if (search) {
      const patients = await Patient.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      query.patient = { $in: patients.map((entry) => entry._id) };
    }

    const mergedReports = await loadMergedReports(query);
    const filteredReports = status
      ? mergedReports.filter((report) => report.status === status)
      : mergedReports;
    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const total = filteredReports.length;
    const reports = filteredReports.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

    res.json({ reports, total, page: pageNumber, pages: Math.ceil(total / pageSize) || 1 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate(reportPopulate);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if ((!report.tests || !report.tests.length) && report.appointment) {
      const mergedReports = await loadMergedReports({ appointment: report.appointment._id || report.appointment });
      const merged = mergedReports.find((entry) => String(entry._id) === String(report._id) || entry.legacyReportIds?.some((id) => String(id) === String(report._id)));
      if (merged) return res.json(merged);
    }

    const normalizedReport = await normalizeReport(report);
    res.json(normalizedReport);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.body.status === 'entered') updateData.enteredBy = req.user._id;
    if (req.body.status === 'verified') {
      updateData.verifiedBy = req.user._id;
      updateData.verifiedAt = new Date();
    }
    if (req.body.status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    const report = await Report.findById(req.params.id).populate(reportPopulate);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const patient = report.patient?._id
      ? report.patient
      : await Patient.findById(report.patient).select('gender');
    const patientGender = patient?.gender;

    const isMultiTestReport = Array.isArray(report.tests) && report.tests.length > 0;

    if (isMultiTestReport) {
      const tests = await fetchTestsForReport(report);
      if (req.body.results) {
        updateData.results = buildReportResults(tests, req.body.results, patientGender);
        const validationMessage = validateReportResults(updateData.results);
        if (validationMessage) {
          return res.status(400).json({ message: validationMessage });
        }
      }

      const updatedReport = await Report.findByIdAndUpdate(report._id, updateData, { new: true }).populate(reportPopulate);
      return res.json(await normalizeReport(updatedReport));
    }

    const siblingReports = await Report.find({ appointment: report.appointment?._id || report.appointment }).populate(reportPopulate);

    if (req.body.results) {
      for (const sibling of siblingReports) {
        const tests = await fetchTestsForReport(sibling);
        const siblingResults = buildReportResults(tests, req.body.results, patientGender);
        const validationMessage = validateReportResults(siblingResults);
        if (validationMessage) {
          return res.status(400).json({ message: validationMessage });
        }
        await Report.findByIdAndUpdate(sibling._id, {
          ...updateData,
          results: siblingResults,
        });
      }
    } else {
      await Report.updateMany(
        { appointment: report.appointment?._id || report.appointment },
        { $set: updateData }
      );
    }

    const mergedReports = await loadMergedReports({ appointment: report.appointment?._id || report.appointment });
    const merged = mergedReports.find((entry) => entry.legacyReportIds?.some((id) => String(id) === String(report._id))) || mergedReports[0];
    res.json(merged);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/appointment/:appointmentId', protect, async (req, res) => {
  try {
    const reports = await loadMergedReports({ appointment: req.params.appointmentId });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
