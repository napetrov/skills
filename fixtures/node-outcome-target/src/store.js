// In-memory measurement store. Comparison reads records and must never start a scan.
export class MeasurementStore {
  constructor(records) {
    this.records = new Map(records.map((record) => [record.id, record]));
    this.scanCount = 0;
  }

  getCompleted(id) {
    const record = this.records.get(id);
    if (!record) throw new Error(`unknown measurement ${id}`);
    if (record.status !== "completed") throw new Error(`measurement ${id} is ${record.status}, not completed`);
    return record;
  }

  startScan() {
    this.scanCount += 1;
    return null;
  }
}
