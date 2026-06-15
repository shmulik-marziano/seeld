import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Rasterise a DOM element (Hebrew renders natively) and lay it across A4 pages.
 * Used to export the live report dashboard as a branded PDF.
 */
export async function exportElementToPdf(
  el: HTMLElement,
  filename: string,
  background = "#07060f"
): Promise<void> {
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: background,
    useCORS: true,
    logging: false,
    windowWidth: el.scrollWidth,
  });

  const img = canvas.toDataURL("image/jpeg", 0.92);
  const pdf = new jsPDF({ unit: "px", format: "a4", orientation: "portrait", compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pageW) / canvas.width;

  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(img, "JPEG", 0, position, pageW, imgH);
  heightLeft -= pageH;

  while (heightLeft > 0) {
    position -= pageH;
    pdf.addPage();
    pdf.addImage(img, "JPEG", 0, position, pageW, imgH);
    heightLeft -= pageH;
  }

  pdf.save(filename);
}
