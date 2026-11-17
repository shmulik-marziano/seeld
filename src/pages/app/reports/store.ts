// In-memory hand-off between the hub (uploads) and the viewer. Nothing is persisted or sent anywhere.
import type { ReportData } from "@/reports/types";

let current: ReportData | null = null;

export const setUploadedReport = (d: ReportData | null) => { current = d; };
export const getUploadedReport = () => current;
