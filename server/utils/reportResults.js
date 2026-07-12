const buildReportResults = (test, existingResults = []) => {
  const parameters = Array.isArray(test?.parameters) ? test.parameters : [];
  const existingByName = new Map(
    (Array.isArray(existingResults) ? existingResults : []).map((result) => [result.parameterName, result])
  );

  return parameters.map((parameter) => {
    const existing = existingByName.get(parameter.name);
    return {
      parameterName: parameter.name,
      value: existing?.value || '',
      unit: existing?.unit || parameter.unit || '',
      normalRange: existing?.normalRange || parameter.normalRange?.general?.text || '',
      flag: existing?.flag || '',
    };
  });
};

module.exports = { buildReportResults };
