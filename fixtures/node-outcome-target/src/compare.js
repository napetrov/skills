// Compare two completed measurements. Different project or fingerprint means not comparable.
export function compareMeasurements(store, idA, idB) {
  const left = store.getCompleted(idA);
  const right = store.getCompleted(idB);
  if (left.projectId !== right.projectId || left.fingerprint !== right.fingerprint) {
    return {
      comparable: false,
      reason: "fingerprint-mismatch",
      changes: [],
      limitations: ["measurements come from different project configurations and were not compared"],
    };
  }
  const changes = [];
  const files = [...new Set([...Object.keys(left.files), ...Object.keys(right.files)])].sort();
  for (const file of files) {
    const before = left.files[file];
    const after = right.files[file];
    if (!before) changes.push({ path: file, type: "added", lines: after.lines });
    else if (!after) changes.push({ path: file, type: "removed", lines: before.lines });
    else if (before.lines !== after.lines) changes.push({ path: file, type: "modified", delta: after.lines - before.lines });
  }
  return { comparable: true, reason: null, changes, limitations: [] };
}
