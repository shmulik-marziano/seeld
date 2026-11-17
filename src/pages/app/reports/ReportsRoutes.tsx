// Mounted (lazy) at /app/reports/* inside the agent portal guard (src/App.tsx). The whole report engine lives in this chunk.
import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { CaLoading } from "@/components/sd/client";
import { useSdFont } from "@/components/sd/primitives";
import "./reports-pages.css";

const Hub = lazy(() => import("./Hub"));
const Viewer = lazy(() => import("./Viewer"));

export default function ReportsRoutes() {
  useSdFont();
  return (
    <Suspense fallback={<CaLoading label="טוען את מסך הדוחות" tone="sky" />}>
      <Routes>
        <Route index element={<Hub />} />
        <Route path="view" element={<Viewer />} />
        <Route path="*" element={<Navigate to="/app/reports" replace />} />
      </Routes>
    </Suspense>
  );
}
