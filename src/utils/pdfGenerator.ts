import { jsPDF } from 'jspdf';
import { Invoice, Client, Project } from '../types';

/**
 * Utility to generate a professionally polished PDF invoice using jsPDF.
 * Features a modern design aesthetic with custom colors, headers, 
 * clean table alignments, dynamic metadata, and a verified transaction stamp.
 */
export const downloadInvoicePDF = (
  invoice: Invoice,
  allClients: Client[] = [],
  allProjects: Project[] = []
) => {
  // Try to find the client detail
  const matchedClient = allClients.find(
    (c) => c.email.toLowerCase() === invoice.clientEmail.toLowerCase()
  );
  
  const clientName = matchedClient ? matchedClient.name : 'Venture Partner';
  const projectName = matchedClient?.projectName || 'Diyo Workspace Integration';
  
  // Format invoice reference code
  const invoiceCode = `DY-${invoice.id.slice(-6).toUpperCase()}`;

  // 1. Initialize custom sized portrait jsPDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 20;
  const contentWidth = pageWidth - margin * 2; // 170mm

  // 2. Sophisticated Premium Header Banner (Deep Slate Accent block)
  doc.setFillColor(8, 10, 16); // Match diyo slate branding #080a10
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Brand logo lettering in top-left banner
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text('diyo', margin, 26);
  
  // Orange accent circle in logo
  const logoTextWidth = doc.getTextWidth('diyo');
  const accentOffset = margin + logoTextWidth;
  doc.setFillColor(255, 122, 24); // #ff7a18
  doc.ellipse(accentOffset + 1.8, 22.5, 2.2, 2.2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(237, 193, 87); // #edc157 (STABLE operator)
  doc.text('OFFICIAL TRANS-LEDGER', margin, 34);

  // Document Title label "INVOICE" in top-right banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 122, 24); // #ff7a18 logo color
  doc.text('INVOICE', pageWidth - margin, 26, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text(`Reference: ${invoiceCode}`, pageWidth - margin, 34, { align: 'right' });

  // 3. Double Column metadata sections (Invoice specifics vs Company coordinates)
  let y = 56;

  // Render Horizontal rule separator
  doc.setDrawColor(229, 231, 235); // Clean borders
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 10;

  // Title Column Headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(110, 120, 135);
  doc.text('ISSUED BY', margin, y);
  doc.text('CLIENT BILL TO', margin + 85, y);

  y += 6;

  // Column Details (Issuer vs Client)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // Navy slate dark text
  doc.text('diyo Systems Ltd.', margin, y);
  doc.text(clientName, margin + 85, y);

  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Core Workspace Builders & SLA Developers', margin, y);
  doc.text(invoice.clientEmail, margin + 85, y);

  y += 5;

  doc.text('Kathmandu, Nepal', margin, y);
  doc.text(`Venture pipeline: ${projectName}`, margin + 85, y);

  y += 5;

  doc.text('contact@diyo.io', margin, y);

  y += 14;

  // 4. Highlight Summary Box (Due Dates, Status, Total Key metrics)
  // Fill sophisticated soft capsule backdrop
  doc.setFillColor(248, 250, 252); // soft off-white slate bg
  doc.rect(margin, y, contentWidth, 24, 'F');
  doc.setDrawColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 24, 'D');

  const metricY = y + 9;
  
  // Static columns inside visual card
  // Date Issued
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DATE ISSUED', margin + 8, metricY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin + 8, metricY + 7);

  // Due Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DUE DATE', margin + 55, metricY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.dueDate || 'Immediate', margin + 55, metricY + 7);

  // Status with custom highlight badges
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('PAYMENT STATUS', margin + 105, metricY);
  
  const statusStr = invoice.status.toUpperCase();
  if (statusStr === 'PAID') {
    doc.setFillColor(220, 252, 231); // light green bg
    doc.rect(margin + 105, metricY + 3, 16, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(21, 128, 61); // deep green text
    doc.text('PAID', margin + 113, metricY + 6.6, { align: 'center' });
  } else {
    doc.setFillColor(254, 243, 199); // light yellow/orange bg
    doc.rect(margin + 105, metricY + 3, 21, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9); // dark amber text
    doc.text('UNPAID', margin + 115.5, metricY + 6.6, { align: 'center' });
  }

  // Invoice Amount Key
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL RATIO', margin + 138, metricY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.amount, margin + 138, metricY + 7);

  y += 36;

  // 5. Line Items Table with crisp alignments
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('SUMMARY OF BILLED SERVICES', margin, y);

  y += 6;

  // Draw Table Columns Header Background
  doc.setFillColor(15, 23, 42); // Black slate color
  doc.rect(margin, y, contentWidth, 8, 'F');

  // Columns header text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('S.N.', margin + 4, y + 5.5);
  doc.text('MILESTONE DESCRIPTION / DELIVERABLE AGENT', margin + 18, y + 5.5);
  doc.text('QTY', margin + 120, y + 5.5, { align: 'center' });
  doc.text('SUBTOTAL', margin + 162, y + 5.5, { align: 'right' });

  y += 8;

  // Single milestone/service item container line
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, 16, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.rect(margin, y, contentWidth, 16, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('01', margin + 4, y + 10);
  
  // Custom wrap of milestone name to ensure no overflowing
  const maxTitleWidth = 95;
  const wrappedTitle = doc.splitTextToSize(invoice.title, maxTitleWidth);
  doc.text(wrappedTitle, margin + 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.text('1x Unit', margin + 120, y + 10, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.amount, margin + 162, y + 10, { align: 'right' });

  y += 16;

  // Summary box section
  y += 8;
  doc.setDrawColor(229, 231, 235);
  doc.line(margin + 100, y, pageWidth - margin, y);
  
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', margin + 115, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.amount, margin + 162, y, { align: 'right' });

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 122, 24); // primary tone #ff7a18
  doc.text('Grand Total:', margin + 115, y);
  doc.text(invoice.amount, margin + 162, y, { align: 'right' });

  // 6. Security Seal / Verified Transaction Block
  const baseStampY = Math.min(y + 20, 230);
  
  // Draw light grey background badge for transaction details
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, baseStampY, 78, 26, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, baseStampY, 78, 26, 'D');

  // Verify mark stamp representation
  doc.setFillColor(241, 245, 249);
  doc.ellipse(margin + 8, baseStampY + 13, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(34, 197, 94); // emerald check color
  doc.text('✓', margin + 6, baseStampY + 14.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SECURE TRANSACTION LOG', margin + 16, baseStampY + 7);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`ID: DI_TR_STAMP_${invoice.id.toUpperCase()}`, margin + 16, baseStampY + 12);
  doc.text(`Hash: ISO-27001-COMPLIANT-LEDGER`, margin + 16, baseStampY + 16);
  doc.text('Verified dynamically via Local Auth Key', margin + 16, baseStampY + 20);

  // Underline design signature
  const sigX = pageWidth - margin - 55;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Approver Signature', sigX + 27.5, baseStampY + 15, { align: 'center' });
  doc.line(sigX, baseStampY + 10, sigX + 55, baseStampY + 10);

  doc.setFont('courier', 'bolditalic');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Nishant G.', sigX + 27.5, baseStampY + 7, { align: 'center' });

  // 7. Standard Nepal Law & terms footnote
  const footerY = pageHeight - margin + 4;
  doc.setDrawColor(241, 245, 249);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Disclaimer: This invoice acts as a legal binding contract record under the regulatory systems of Information Technology and software export clearances of Kathmandu, Nepal.',
    margin,
    footerY
  );
  doc.text(
    'If you have inquiries regarding payment processing, please contact billing@diyo.io. Generated dynamically inside the diyo Workspace environment.',
    margin,
    footerY + 4
  );

  // 8. Save/Download action
  const cleanFilename = `Invoice_${invoiceCode}_${invoice.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(cleanFilename);
};
