import { useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';

export default function TestSelectionModal({
  open,
  report,
  actionLabel = 'continue',
  onClose,
  onConfirm,
}) {
  const tests = useMemo(() => {
    if (Array.isArray(report?.tests) && report.tests.length) return report.tests;
    if (report?.test) return [report.test];
    return [];
  }, [report]);

  const [selectedTestId, setSelectedTestId] = useState('');

  useEffect(() => {
    if (!open) {
      setSelectedTestId('');
    }
  }, [open, report?._id]);

  if (!open) return null;

  const canConfirm = Boolean(selectedTestId);

  return (
    <Modal open={open} onClose={onClose} title="Select Test" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Multiple tests are available in this report. Choose one test before {actionLabel}.
        </p>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tests.map((test) => {
            const testId = String(test?._id || test);
            return (
              <label key={testId} className="flex items-start gap-3 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="selectedTest"
                  value={testId}
                  checked={selectedTestId === testId}
                  onChange={(event) => setSelectedTestId(event.target.value)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-slate-800">{test?.name || 'Unnamed test'}</p>
                  {test?.sampleType && <p className="text-xs text-slate-500">{test.sampleType}</p>}
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={() => onConfirm(selectedTestId)}
            disabled={!canConfirm}
            className="btn-primary disabled:opacity-50"
          >
            {actionLabel === 'share' ? 'Share Selected Test' : 'Print Selected Test'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
