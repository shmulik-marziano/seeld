import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

// Hebrew font embedding: we use the built-in Helvetica with manual RTL handling
// For proper Hebrew, we reverse strings since jsPDF doesn't natively support RTL

function reverseHebrew(text: string): string {
  if (!text) return '';
  // Split by newlines, reverse each line's characters for RTL display
  return text.split('\n').map(line => {
    // Keep numbers and English LTR, reverse Hebrew
    const chars = [...line];
    return chars.reverse().join('');
  }).join('\n');
}

// Simple approach: use Unicode-aware text positioning
function addRtlText(doc: jsPDF, text: string, x: number, y: number, options?: any) {
  doc.text(text, x, y, { align: 'right', ...options });
}

interface ProductData {
  company: string | null;
  productType: string | null;
  category: string;
  policyNumber: string | null;
  monthlyPremium?: number | null;
  monthlyDeposit?: number | null;
  accumulation: number | null;
  managementFeeDeposit: number | null;
  managementFeeAccumulation: number | null;
  phase: string | null;
}

interface RecommendationData {
  title: string;
  rationale: string;
  currentState: string | null;
  problemGap: string | null;
  improvement: string | null;
  advantages: string | null;
  disadvantages: string | null;
  actionType: string;
  recommendationType: string | null;
  urgency: string | null;
  recommendedCompany: string | null;
  costBefore: number | null;
  costAfter: number | null;
  product?: ProductData;
}

interface PdfOptions {
  customerName: string;
  customerId: string;
  agentName?: string;
  agencyName?: string;
  products: ProductData[];
  recommendations: RecommendationData[];
  date?: string;
}

export function generateRecommendationPdf(options: PdfOptions): jsPDF {
  const { customerName, customerId, agentName, agencyName, products, recommendations, date } = options;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  // Use Helvetica (built-in, supports basic chars)
  doc.setFont('Helvetica');

  // === HEADER ===
  // Green header bar
  doc.setFillColor(43, 74, 56); // primary forest green
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Agency/brand name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(agencyName || 'SeeID', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.text('Financial & Insurance Recommendations', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(8);
  const dateStr = date || new Date().toLocaleDateString('he-IL');
  doc.text(dateStr, pageWidth - margin, 36, { align: 'right' });

  yPos = 50;

  // === CUSTOMER INFO ===
  doc.setTextColor(43, 74, 56);
  doc.setFontSize(14);
  doc.text('Customer Details', pageWidth - margin, yPos, { align: 'right' });
  yPos += 8;

  doc.setDrawColor(43, 74, 56);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  const customerInfo = [
    [`Customer: ${customerName}`, `ID: ${customerId.replace(/(\d{5})(\d+)/, '$1***')}`],
    [agentName ? `Agent: ${agentName}` : '', `Date: ${dateStr}`],
  ];

  customerInfo.forEach(row => {
    doc.text(row[0], pageWidth - margin, yPos, { align: 'right' });
    if (row[1]) doc.text(row[1], margin + contentWidth / 2, yPos, { align: 'right' });
    yPos += 5;
  });

  yPos += 5;

  // === PRODUCTS TABLE ===
  if (products.length > 0) {
    doc.setTextColor(43, 74, 56);
    doc.setFontSize(13);
    doc.text(`Current Products (${products.length})`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 4;

    doc.autoTable({
      startY: yPos,
      head: [['Status', 'Fee %', 'Accumulation', 'Monthly', 'Policy #', 'Type', 'Company', '#']],
      body: products.map((p, i) => {
        const monthlyAmount = p.category === 'ביטוח' ? p.monthlyPremium : p.monthlyDeposit;
        return [
        p.phase || 'Active',
        p.managementFeeDeposit != null ? `${p.managementFeeDeposit}%` : '-',
        p.accumulation ? `₪${p.accumulation.toLocaleString()}` : '-',
        monthlyAmount ? `₪${monthlyAmount}` : '-',
        p.policyNumber || '-',
        p.productType || '-',
        p.company || '-',
        String(i + 1),
      ]; }),
      styles: {
        fontSize: 8,
        cellPadding: 2,
        halign: 'center',
      },
      headStyles: {
        fillColor: [43, 74, 56],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 240, 232],
      },
      margin: { left: margin, right: margin },
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // === RECOMMENDATIONS ===
  recommendations.forEach((rec, idx) => {
    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    // Recommendation header card
    doc.setFillColor(245, 240, 232); // cream bg
    doc.roundedRect(margin, yPos - 2, contentWidth, 12, 2, 2, 'F');

    doc.setTextColor(43, 74, 56);
    doc.setFontSize(11);
    doc.text(`Recommendation ${idx + 1}: ${rec.title}`, pageWidth - margin - 3, yPos + 5, { align: 'right' });

    // Urgency badge
    if (rec.urgency) {
      const urgencyColors: Record<string, number[]> = {
        'קריטי': [220, 38, 38],
        'חשוב': [234, 179, 8],
        'אפשר להמתין': [156, 163, 175],
      };
      const color = urgencyColors[rec.urgency] || [156, 163, 175];
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(margin + 2, yPos, 18, 6, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      const urgencyLabel = rec.urgency === 'קריטי' ? 'Critical' : rec.urgency === 'חשוב' ? 'Important' : 'Can Wait';
      doc.text(urgencyLabel, margin + 11, yPos + 4, { align: 'center' });
    }

    yPos += 14;

    // Product context
    if (rec.product) {
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Product: ${rec.product.company || ''} - ${rec.product.productType || ''} | ${rec.product.category}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
    }

    // Type badges
    doc.setFontSize(8);
    doc.setTextColor(43, 74, 56);
    const badges = [rec.recommendationType, rec.actionType].filter(Boolean).join(' | ');
    if (badges) {
      doc.text(`Type: ${badges}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
    }

    // Content sections
    const sections: [string, string | null][] = [
      ['Current State', rec.currentState],
      ['Problem / Gap', rec.problemGap],
      ['Rationale', rec.rationale],
      ['Advantages', rec.advantages],
      ['Disadvantages', rec.disadvantages],
      ['Improvement', rec.improvement],
    ];

    doc.setFontSize(9);
    sections.forEach(([label, value]) => {
      if (!value) return;
      if (yPos > 270) { doc.addPage(); yPos = 20; }

      doc.setTextColor(43, 74, 56);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${label}:`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 4;

      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(value, contentWidth - 5);
      lines.forEach((line: string) => {
        if (yPos > 275) { doc.addPage(); yPos = 20; }
        doc.text(line, pageWidth - margin, yPos, { align: 'right' });
        yPos += 4;
      });
      yPos += 2;
    });

    // Cost comparison
    if (rec.costBefore != null || rec.costAfter != null) {
      if (yPos > 265) { doc.addPage(); yPos = 20; }
      doc.setFillColor(240, 248, 240);
      doc.roundedRect(margin, yPos - 2, contentWidth, 10, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(43, 74, 56);
      let costText = '';
      if (rec.costBefore != null) costText += `Before: ₪${rec.costBefore}`;
      if (rec.costAfter != null) costText += `  |  After: ₪${rec.costAfter}`;
      if (rec.costBefore != null && rec.costAfter != null && rec.costAfter < rec.costBefore) {
        costText += `  |  Savings: ₪${(rec.costBefore - rec.costAfter).toFixed(0)}`;
      }
      doc.text(costText, pageWidth / 2, yPos + 4, { align: 'center' });
      yPos += 14;
    }

    // Recommended company
    if (rec.recommendedCompany) {
      doc.setFontSize(8);
      doc.setTextColor(43, 74, 56);
      doc.text(`Recommended Company: ${rec.recommendedCompany}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;
    }

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margin + 20, yPos, pageWidth - margin - 20, yPos);
    yPos += 8;
  });

  // === FOOTER ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`${agencyName || 'SeeID'} | Confidential | Page ${i}/${pageCount}`, pageWidth / 2, 290, { align: 'center' });
  }

  return doc;
}

export function downloadRecommendationPdf(options: PdfOptions) {
  const doc = generateRecommendationPdf(options);
  const fileName = `recommendations_${options.customerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// ============ Execution Summary PDF ============

interface ExecutionSummaryPdfItem {
  title: string;
  company: string;
  productType: string;
  recommendedText: string;
  actualText: string;
  status: string;
  executedAt: string;
  executedBy: string;
  notes: string;
}

interface ExecutionSummaryPdfOptions {
  customerName: string;
  customerId: string;
  summaryNumber: number;
  status: string;
  generalNotes: string;
  date: string;
  items: ExecutionSummaryPdfItem[];
  agentName?: string;
  agencyName?: string;
}

export function generateExecutionSummaryPdf(options: ExecutionSummaryPdfOptions): jsPDF {
  const { customerName, customerId, summaryNumber, status, generalNotes, date, items, agentName, agencyName } = options;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  doc.setFont('Helvetica');

  // Header
  doc.setFillColor(43, 74, 56);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(agencyName || 'SeeID', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Execution Summary #${summaryNumber}`, pageWidth / 2, 28, { align: 'center' });
  doc.setFontSize(8);
  doc.text(date, pageWidth - margin, 36, { align: 'right' });

  yPos = 50;

  // Customer info
  doc.setTextColor(43, 74, 56);
  doc.setFontSize(14);
  doc.text('Execution Summary', pageWidth - margin, yPos, { align: 'right' });
  yPos += 8;
  doc.setDrawColor(43, 74, 56);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Customer: ${customerName}`, pageWidth - margin, yPos, { align: 'right' });
  doc.text(`ID: ${customerId.replace(/(\d{5})(\d+)/, '$1***')}`, margin + contentWidth / 2, yPos, { align: 'right' });
  yPos += 5;
  doc.text(`Status: ${status}`, pageWidth - margin, yPos, { align: 'right' });
  if (agentName) doc.text(`Agent: ${agentName}`, margin + contentWidth / 2, yPos, { align: 'right' });
  yPos += 10;

  // Items table
  doc.autoTable({
    startY: yPos,
    head: [['Notes', 'Status', 'Executed', 'Recommended', 'Product', '#']],
    body: items.map((item, i) => [
      item.notes || '-',
      item.status,
      (item.actualText || '-').substring(0, 60),
      (item.recommendedText || '-').substring(0, 60),
      `${item.company} ${item.productType}`.trim() || '-',
      String(i + 1),
    ]),
    styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [43, 74, 56], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 240, 232] },
    margin: { left: margin, right: margin },
    columnStyles: { 2: { cellWidth: 40 }, 3: { cellWidth: 40 } },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Detailed items
  items.forEach((item, idx) => {
    if (yPos > 240) { doc.addPage(); yPos = 20; }

    doc.setFillColor(245, 240, 232);
    doc.roundedRect(margin, yPos - 2, contentWidth, 10, 2, 2, 'F');
    doc.setTextColor(43, 74, 56);
    doc.setFontSize(10);
    doc.text(`${idx + 1}. ${item.title}`, pageWidth - margin - 3, yPos + 4, { align: 'right' });

    // Status badge
    const statusColor = item.status.includes('מלא') ? [34, 197, 94] : item.status.includes('חלקית') ? [234, 179, 8] : [156, 163, 175];
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(margin + 2, yPos, 22, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.text(item.status, margin + 13, yPos + 4, { align: 'center' });

    yPos += 14;

    const sections: [string, string][] = [
      ['Recommended', item.recommendedText],
      ['Actual Execution', item.actualText],
    ];

    doc.setFontSize(8);
    sections.forEach(([label, value]) => {
      if (!value) return;
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      doc.setTextColor(43, 74, 56);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${label}:`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 4;
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(value, contentWidth - 5);
      lines.forEach((line: string) => {
        if (yPos > 275) { doc.addPage(); yPos = 20; }
        doc.text(line, pageWidth - margin, yPos, { align: 'right' });
        yPos += 4;
      });
      yPos += 2;
    });

    if (item.executedAt || item.executedBy) {
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      const meta = [item.executedAt ? `Date: ${item.executedAt}` : '', item.executedBy ? `By: ${item.executedBy}` : ''].filter(Boolean).join(' | ');
      doc.text(meta, pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
    }

    if (item.notes) {
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(`Notes: ${item.notes}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
    }

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margin + 20, yPos, pageWidth - margin - 20, yPos);
    yPos += 6;
  });

  // General notes
  if (generalNotes) {
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    doc.setTextColor(43, 74, 56);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text('General Notes', pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(generalNotes, contentWidth);
    lines.forEach((line: string) => {
      if (yPos > 275) { doc.addPage(); yPos = 20; }
      doc.text(line, pageWidth - margin, yPos, { align: 'right' });
      yPos += 4;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`${agencyName || 'SeeID'} | Execution Summary | Page ${i}/${pageCount}`, pageWidth / 2, 290, { align: 'center' });
  }

  return doc;
}
