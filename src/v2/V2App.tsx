import { Routes, Route, Navigate } from "react-router-dom";
import "./theme.css";
import Landing from "./pages/Landing";
import ReportStudio from "./pages/ReportStudio";
import AdvisorChat from "./pages/AdvisorChat";

/** Self-contained v2 product. Mounted at /v2/* — the existing site is untouched. */
export default function V2App() {
  return (
    <Routes>
      <Route index element={<Landing />} />
      <Route path="studio" element={<ReportStudio />} />
      <Route path="advisor" element={<AdvisorChat />} />
      <Route path="*" element={<Navigate to="/v2" replace />} />
    </Routes>
  );
}
