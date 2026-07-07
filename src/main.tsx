import { createRoot } from "react-dom/client";
import { Component, ErrorInfo, ReactNode } from "react";
import App from "./App.tsx";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("SEELD Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" style={{ fontFamily: "sans-serif", textAlign: "center", padding: "60px 20px" }}>
          <h1 style={{ color: "#171717", fontSize: "24px" }}>SEELD</h1>
          <p style={{ color: "#666", marginTop: "16px" }}>מתנצלים, משהו השתבש. אנחנו עובדים על זה.</p>
          <p style={{ color: "#999", fontSize: "12px", marginTop: "8px" }}>{this.state.error}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: "20px", padding: "12px 32px", background: "#171717", color: "white", border: "none", borderRadius: "999px", cursor: "pointer", fontSize: "16px" }}>
            רענן את הדף
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
