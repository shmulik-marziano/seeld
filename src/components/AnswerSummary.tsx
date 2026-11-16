import { useLocation } from "react-router-dom";
import { answerSummaries } from "@/data/answerSummaries";

const DEFAULT_CLASS = "mt-5 text-[17px] sm:text-[18px] max-w-2xl leading-[1.7] font-medium";

/** Answer-first paragraph for product pages: what it is and who it fits. */
export default function AnswerSummary({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const text = answerSummaries[pathname.replace(/\/$/, "")];
  if (!text) return null;
  return (
    <p className={className ?? DEFAULT_CLASS} data-answer-summary>
      {text}
    </p>
  );
}
