import { useLocation } from "react-router-dom";
import { answerSummaries } from "@/data/answerSummaries";

/** Answer-first paragraph for product pages: what it is and who it fits. */
export default function AnswerSummary() {
  const { pathname } = useLocation();
  const text = answerSummaries[pathname.replace(/\/$/, "")];
  if (!text) return null;
  return (
    <p className="mt-5 text-[17px] sm:text-[18px] max-w-2xl leading-[1.7] font-medium" data-answer-summary>
      {text}
    </p>
  );
}
