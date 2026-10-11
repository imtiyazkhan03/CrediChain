import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

export interface CertificateGenerationInput {
  certId: string;
  studentName: string;
  studentId: string;
  degree: string;
  department: string;
  honors?: string;
  conferralDate: string;
  issuerName?: string;
  issuerRole?: string;
  coSignerName?: string;
  coSignerRole?: string;
  verificationBaseUrl?: string;
}

/**
 * Generates an official, high-resolution vector PDF certificate.
 * Includes ornate academic borders, university seal, dual signatures, and embedded verification QR code.
 *
 * @param input Certificate recipient and credential details
 * @returns Uint8Array containing exact final PDF bytes
 */
export async function generateAcademicCertificatePdf(
  input: CertificateGenerationInput
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Set standard A4 Landscape dimensions (841.89 x 595.28 points)
  const width = 842;
  const height = 595;
  const page = pdfDoc.addPage([width, height]);

  // Load standard fonts
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesRomanItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);

  // Palette: Institutional Trust Modernist
  const emeraldTeal = rgb(0.0, 0.408, 0.373); // #00685F
  const academicGold = rgb(0.851, 0.467, 0.024); // #D97706
  const midnightNavy = rgb(0.059, 0.09, 0.165); // #0F172A
  const slateText = rgb(0.392, 0.455, 0.545); // #64748B
  const parchmentBg = rgb(0.984, 0.98, 0.969); // #FAFAF7

  // 1. Draw subtle parchment background fill
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: parchmentBg,
  });

  // 2. Draw outer ornate border (Emerald Teal)
  const outerMargin = 24;
  page.drawRectangle({
    x: outerMargin,
    y: outerMargin,
    width: width - outerMargin * 2,
    height: height - outerMargin * 2,
    borderColor: emeraldTeal,
    borderWidth: 4,
  });

  // 3. Draw inner hairline border (Academic Gold)
  const innerMargin = 32;
  page.drawRectangle({
    x: innerMargin,
    y: innerMargin,
    width: width - innerMargin * 2,
    height: height - innerMargin * 2,
    borderColor: academicGold,
    borderWidth: 1.5,
  });

  // 4. Corner ornament cornerstones (small gold squares in 4 corners)
  const cornerSize = 8;
  const corners = [
    { x: innerMargin - cornerSize / 2, y: innerMargin - cornerSize / 2 },
    { x: width - innerMargin - cornerSize / 2, y: innerMargin - cornerSize / 2 },
    { x: innerMargin - cornerSize / 2, y: height - innerMargin - cornerSize / 2 },
    { x: width - innerMargin - cornerSize / 2, y: height - innerMargin - cornerSize / 2 },
  ];
  corners.forEach((c) => {
    page.drawRectangle({
      x: c.x,
      y: c.y,
      width: cornerSize,
      height: cornerSize,
      color: academicGold,
    });
  });

  // 5. Header: Institution Name & Seal
  const title = 'STANFORD UNIVERSITY';
  const titleSize = 26;
  const titleWidth = timesRomanBold.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: height - 85,
    size: titleSize,
    font: timesRomanBold,
    color: midnightNavy,
  });

  const departmentText = (input.department || 'SCHOOL OF ENGINEERING').toUpperCase();
  const deptSize = 13;
  const deptWidth = helveticaBold.widthOfTextAtSize(departmentText, deptSize);
  page.drawText(departmentText, {
    x: (width - deptWidth) / 2,
    y: height - 105,
    size: deptSize,
    font: helveticaBold,
    color: emeraldTeal,
  });

  const motto = 'Die Luft der Freiheit weht';
  const mottoSize = 10;
  const mottoWidth = timesRomanItalic.widthOfTextAtSize(motto, mottoSize);
  page.drawText(motto, {
    x: (width - mottoWidth) / 2,
    y: height - 120,
    size: mottoSize,
    font: timesRomanItalic,
    color: slateText,
  });

  // Decorative Rule below header
  page.drawLine({
    start: { x: width / 2 - 140, y: height - 132 },
    end: { x: width / 2 + 140, y: height - 132 },
    thickness: 1,
    color: academicGold,
  });

  // 6. Conferral Text
  const preamble = 'The Board of Trustees on recommendation of the Academic Council has conferred upon';
  const preambleSize = 11;
  const preambleWidth = timesRoman.widthOfTextAtSize(preamble, preambleSize);
  page.drawText(preamble, {
    x: (width - preambleWidth) / 2,
    y: height - 165,
    size: preambleSize,
    font: timesRoman,
    color: slateText,
  });

  // Recipient Name (Featured display text)
  const name = input.studentName;
  const nameSize = 28;
  const nameWidth = timesRomanBold.widthOfTextAtSize(name, nameSize);
  page.drawText(name, {
    x: (width - nameWidth) / 2,
    y: height - 205,
    size: nameSize,
    font: timesRomanBold,
    color: midnightNavy,
  });

  // Student UID
  const studentUidText = `Student UID: ${input.studentId}`;
  const uidSize = 9;
  const uidWidth = courier.widthOfTextAtSize(studentUidText, uidSize);
  page.drawText(studentUidText, {
    x: (width - uidWidth) / 2,
    y: height - 222,
    size: uidSize,
    font: courier,
    color: slateText,
  });

  // Degree Degree Text
  const degreeIntro = 'the degree of';
  const degreeIntroSize = 11;
  const degreeIntroWidth = timesRomanItalic.widthOfTextAtSize(degreeIntro, degreeIntroSize);
  page.drawText(degreeIntro, {
    x: (width - degreeIntroWidth) / 2,
    y: height - 245,
    size: degreeIntroSize,
    font: timesRomanItalic,
    color: slateText,
  });

  // Degree Title
  const degreeTitle = input.degree;
  const degreeSize = 20;
  const degreeWidth = timesRomanBold.widthOfTextAtSize(degreeTitle, degreeSize);
  page.drawText(degreeTitle, {
    x: (width - degreeWidth) / 2,
    y: height - 275,
    size: degreeSize,
    font: timesRomanBold,
    color: emeraldTeal,
  });

  // Honors
  if (input.honors && input.honors !== 'None') {
    const honorsText = `with distinction of ${input.honors}`;
    const honorsSize = 12;
    const honorsWidth = timesRomanItalic.widthOfTextAtSize(honorsText, honorsSize);
    page.drawText(honorsText, {
      x: (width - honorsWidth) / 2,
      y: height - 298,
      size: honorsSize,
      font: timesRomanItalic,
      color: academicGold,
    });
  }

  // Conferral Date
  const dateText = `Conferred at Stanford, California on ${input.conferralDate}`;
  const dateSize = 10;
  const dateWidth = timesRoman.widthOfTextAtSize(dateText, dateSize);
  page.drawText(dateText, {
    x: (width - dateWidth) / 2,
    y: height - 330,
    size: dateSize,
    font: timesRoman,
    color: slateText,
  });

  // 7. Embed Dynamic Verification QR Code
  const baseUrl = input.verificationBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://certichain.edu');
  const verifyUrl = `${baseUrl}/verify/${encodeURIComponent(input.certId)}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 140,
      color: {
        dark: '#00685F',
        light: '#FFFFFF',
      },
    });

    const base64Data = qrDataUrl.split(',')[1];
    let qrImageBytes: Uint8Array;
    if (typeof Buffer !== 'undefined') {
      qrImageBytes = Buffer.from(base64Data, 'base64');
    } else {
      const binaryString = atob(base64Data);
      qrImageBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        qrImageBytes[i] = binaryString.charCodeAt(i);
      }
    }
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    const qrSize = 65;

    // Draw QR code in bottom-left
    page.drawImage(qrImage, {
      x: 60,
      y: 65,
      width: qrSize,
      height: qrSize,
    });

    page.drawText('Scan to Verify', {
      x: 62,
      y: 52,
      size: 7.5,
      font: helveticaBold,
      color: emeraldTeal,
    });
  } catch (err) {
    console.warn('Failed to embed QR code in PDF:', err);
  }

  // 8. Dual Signatures
  // Left Signer: University Registrar
  const registrarName = input.issuerName || 'University Registrar';
  const registrarRole = input.issuerRole || 'Registrar & Custodian';
  page.drawLine({
    start: { x: 210, y: 110 },
    end: { x: 370, y: 110 },
    thickness: 1,
    color: emeraldTeal,
  });
  page.drawText(registrarName, {
    x: 210,
    y: 95,
    size: 11,
    font: timesRomanBold,
    color: midnightNavy,
  });
  page.drawText(registrarRole, {
    x: 210,
    y: 82,
    size: 8.5,
    font: helvetica,
    color: slateText,
  });

  // Right Signer: Dean of Academic Affairs
  const deanName = input.coSignerName || 'Academic Dean';
  const deanRole = input.coSignerRole || 'Office of Academic Affairs';
  page.drawLine({
    start: { x: 470, y: 110 },
    end: { x: 630, y: 110 },
    thickness: 1,
    color: emeraldTeal,
  });
  page.drawText(deanName, {
    x: 470,
    y: 95,
    size: 11,
    font: timesRomanBold,
    color: midnightNavy,
  });
  page.drawText(deanRole, {
    x: 470,
    y: 82,
    size: 8.5,
    font: helvetica,
    color: slateText,
  });

  // 9. Central Gold Seal Emblem
  page.drawCircle({
    x: width / 2,
    y: 90,
    size: 26,
    borderColor: academicGold,
    borderWidth: 2,
    color: rgb(0.99, 0.95, 0.88),
  });
  page.drawText('SEAL', {
    x: width / 2 - 12,
    y: 86,
    size: 8,
    font: helveticaBold,
    color: academicGold,
  });

  // 10. Bottom Unique ID & Cryptographic Footprint
  const certIdBadge = `OFFICIAL DIPLOMA ID: ${input.certId}`;
  page.drawText(certIdBadge, {
    x: width - 230,
    y: 65,
    size: 8.5,
    font: courier,
    color: midnightNavy,
  });

  const legalNotice = 'Anchored on EVM Smart Contract · Cryptographically Tamper-Evident';
  page.drawText(legalNotice, {
    x: width - 230,
    y: 52,
    size: 7,
    font: helvetica,
    color: slateText,
  });

  // Save and return final reproducible bytes
  return await pdfDoc.save();
}
