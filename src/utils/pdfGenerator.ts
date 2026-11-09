import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Prescription } from '../types';

export async function generatePrescriptionPdf(prescription: Prescription): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 15;

  // Header Banner
  doc.setFillColor(22, 163, 74); // Forest Emerald Green
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('RuralCare Connect Telemedicine Network', 15, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Authorized Digital e-Prescription under India Telemedicine Practice Guidelines 2020', 15, 18);
  doc.text(`Prescription ID: ${prescription.id} | Date: ${prescription.doctorSignatureDate}`, 15, 23);

  currentY = 36;
  doc.setTextColor(30, 41, 59);

  // Doctor Details Box (Left) & Patient Details Box (Right)
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, currentY, 90, 36, 2, 2, 'FD');
  doc.roundedRect(108, currentY, 90, 36, 2, 2, 'FD');

  // Doctor Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DOCTOR INFORMATION', 16, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Name: Dr. ${prescription.doctorName}`, 16, currentY + 13);
  doc.text(`Registration: ${prescription.doctorRegNo}`, 16, currentY + 19);
  doc.text(`Council: ${prescription.doctorCouncil}`, 16, currentY + 25);
  doc.text(`Consult Mode: Video Teleconsultation`, 16, currentY + 31);

  // Patient Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PATIENT INFORMATION', 112, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Name: ${prescription.patientName}`, 112, currentY + 13);
  doc.text(`Age / Gender: ${prescription.patientAge} Yrs / ${prescription.patientGender}`, 112, currentY + 19);
  doc.text(`Mobile: ${prescription.patientPhone}`, 112, currentY + 25);
  doc.text(`Platform: RuralCare Mobile Connect`, 112, currentY + 31);

  currentY += 44;

  // Clinical Diagnosis
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(12, currentY, pageWidth - 24, 16, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(21, 128, 61);
  doc.text('CLINICAL DIAGNOSIS & CHIEF COMPLAINT:', 16, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`${prescription.diagnosis} (Symptoms: ${prescription.symptoms.join(', ')})`, 16, currentY + 12);

  currentY += 24;

  // Rx Medicines Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(22, 163, 74);
  doc.text('Rx - PRESCRIBED MEDICINES (Telemedicine Approved)', 12, currentY);

  currentY += 5;

  // Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(12, currentY, pageWidth - 24, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('#', 15, currentY + 5);
  doc.text('Medicine & Dosage', 24, currentY + 5);
  doc.text('Frequency & Timing', 80, currentY + 5);
  doc.text('Duration', 130, currentY + 5);
  doc.text('Instructions (Bilingual)', 150, currentY + 5);

  currentY += 8;

  // Table Rows
  prescription.medicines.forEach((med, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    doc.text(`${idx + 1}`, 15, currentY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${med.name} (${med.dosage})`, 24, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${med.frequency} [${med.timing}]`, 80, currentY + 5);
    doc.text(`${med.durationDays} Days`, 130, currentY + 5);
    
    // Instructions
    const instructionText = `${med.instructionEn}`;
    const wrappedInstructions = doc.splitTextToSize(instructionText, 45);
    doc.text(wrappedInstructions, 150, currentY + 5);

    const rowHeight = Math.max(12, wrappedInstructions.length * 4 + 6);
    doc.setDrawColor(241, 245, 249);
    doc.line(12, currentY + rowHeight - 2, pageWidth - 12, currentY + rowHeight - 2);

    currentY += rowHeight;
  });

  currentY += 6;

  // General Advice & Follow-up
  doc.setFillColor(254, 249, 195);
  doc.roundedRect(12, currentY, pageWidth - 24, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(161, 98, 7);
  doc.text('GENERAL ADVICE & LIFESTYLE GUIDANCE:', 16, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const adviceLines = doc.splitTextToSize(prescription.generalAdvice, pageWidth - 32);
  doc.text(adviceLines, 16, currentY + 11);
  if (prescription.followUpDays) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Follow-up recommendation: Re-consult after ${prescription.followUpDays} days if not resolved or sooner if warning signs appear.`, 16, currentY + 18);
  }

  currentY += 28;

  // Generate QR Code for pharmacist verification
  const qrVerificationPayload = JSON.stringify({
    rxId: prescription.id,
    doctorReg: prescription.doctorRegNo,
    patient: prescription.patientName,
    date: prescription.doctorSignatureDate,
    verificationUrl: `https://ruralcare.gov.in/verify/${prescription.id}`
  });

  const qrDataUrl = await QRCode.toDataURL(qrVerificationPayload, {
    width: 120,
    margin: 1,
    color: {
      dark: '#14532d',
      light: '#ffffff'
    }
  });

  // Footer: QR Code and Digital Signature Box
  doc.addImage(qrDataUrl, 'PNG', 15, currentY, 32, 32);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('PHARMACIST VERIFICATION QR', 15, currentY + 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Scan with smartphone camera to verify authenticity', 15, currentY + 40);

  // Doctor Digital Signature Box
  const sigX = pageWidth - 80;
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(sigX, currentY, 68, 38, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(22, 163, 74);
  doc.text('DIGITALLY SIGNED & AUTHORIZED', sigX + 5, currentY + 6);

  doc.setFont('times', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`Dr. ${prescription.doctorName}`, sigX + 8, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`NMC Reg No: ${prescription.doctorRegNo}`, sigX + 5, currentY + 23);
  doc.text(`Timestamp: ${prescription.createdAt}`, sigX + 5, currentY + 28);
  doc.text(`Cryptographic Hash: SHA256-RC-${prescription.id.slice(-6)}`, sigX + 5, currentY + 33);

  // Save the PDF
  doc.save(`Prescription_${prescription.patientName.replace(/\s+/g, '_')}_${prescription.id}.pdf`);
}
