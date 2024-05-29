import axios from 'axios';
import puppeteer from 'puppeteer';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import { IEmployeeDARCollection } from '../@types/database';
export const generatePdf = async (htmlContent: string): Promise<string> => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.setContent(htmlContent);

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
  });

  await browser.close();

  return pdfBuffer.toString('base64'); // Return as base64 string for email attpuachment
};
interface HtmlToPdfPayload {
  html: string;
  file_name: string; // with .pdf extension, e.g., test.pdf
}

export async function generatePdfFromDarData(
  darData: IEmployeeDARCollection[]
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const doc = new PDFDocument({
      layout: 'portrait',
      size: 'A4',
      margins: {
        top: 30,
        bottom: 30,
        left: 30,
        right: 30,
      },
    });

    // Header
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('DAILY ACTIVITY REPORT', { align: 'center' });
    doc.moveDown();
    doc.moveDown();

    doc
      .font('Helvetica')
      .fontSize(10)
      .text('EMPLOYEE REPORT SAMPLE', { align: 'center' });
    doc.moveDown();
    doc.moveDown();

    // Employee DAR Data
    darData.forEach((dar: IEmployeeDARCollection) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(`Employee ID: ${dar.EmpDarEmpId}`);
      doc
        .font('Helvetica')
        .fontSize(12)
        .text(`Employee Name: ${dar.EmpDarEmpName}`);
      doc
        .font('Helvetica')
        .fontSize(12)
        .text(`Client Name: ${dar.EmpDarClientName}`);
      doc
        .font('Helvetica')
        .fontSize(12)
        .text(`Location Name: ${dar.EmpDarLocationName}`);
      doc.font('Helvetica').fontSize(12).text(`Shift Date: ${dar.EmpDarDate}`);
      doc.moveDown();

      // Employee DAR Tiles
      if (dar.EmpDarTile) {
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .text('Employee DAR Tiles:', { underline: true });
        doc.moveDown();

        dar.EmpDarTile.forEach((tile) => {
          doc
            .font('Helvetica-Bold')
            .fontSize(10)
            .text(`Tile Time: ${tile.TileTime}`);
          doc
            .font('Helvetica')
            .fontSize(10)
            .text(`Tile Content: ${tile.TileContent}`);
          doc
            .font('Helvetica')
            .fontSize(10)
            .text(`Tile Location: ${tile.TileLocation}`);
          doc.moveDown();

          // Tile Images
          if (tile.TileImages && tile.TileImages.length > 0) {
            doc.font('Helvetica-Bold').fontSize(10).text('Tile Images:');
            doc.moveDown();

            const imageWidth = 100; // Set the desired width of images
            const imageHeight = 100; // Set the desired height of images

            tile.TileImages.forEach((img) => {
              doc
                .image(img, { width: imageWidth, height: imageHeight })
                .moveDown();
            });
            doc.moveDown();
          }
        });
      }

      // Add a page break after each employee's DAR data
      doc.addPage();
    });

    // Finalize the PDF document
    doc.end();

    // Capture the PDF output in a buffer
    const buffers: Buffer[] = [];
    doc.on('data', (buffer) => buffers.push(buffer));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      const base64String = pdfBuffer.toString('base64');
      resolve(base64String);
    });

    // Handle any errors that occur during PDF generation
    doc.on('error', (err) => reject(err));
  });
}
// import { PDFDocument } from 'pdfkit';

// interface IEmployeeDARCollection {
//   EmpDarEmpId: string;
//   EmpDarEmpName: string;
//   EmpDarClientName: string;
//   EmpDarLocationName: string;
//   EmpDarDate: string;
//   EmpDarTile?: {
//     TileTime: string;
//     TileContent: string;
//     TileLocation: string;
//     TileImages?: string[];
//   }[];
// }

// export async function generatePdfFromDarData(
//   darData: IEmployeeDARCollection[]
// ): Promise<string> {
//   return new Promise<string>((resolve, reject) => {
//     const doc = new PDFDocument({
//       layout: 'portrait',
//       size: 'A4',
//       margins: {
//         top: 30,
//         bottom: 30,
//         left: 30,
//         right: 30,
//       },
//     });

//     // Header
//     doc
//       .font('Helvetica-Bold')
//       .fontSize(18)
//       .text('DAILY ACTIVITY REPORT', { align: 'center', paddingTop: 10 });
//     doc.font('Helvetica')
//       .fontSize(10)
//       .text('EMPLOYEE REPORT SAMPLE', { align: 'center' });
//     doc.moveDown();
//     doc.moveDown();

//     // Employee DAR Data
//     darData.forEach((dar: IEmployeeDARCollection) => {
//       doc
//         .font('Helvetica-Bold')
//         .fontSize(12)
//         .text(`Employee ID: ${dar.EmpDarEmpId}`);
//       doc
//         .font('Helvetica')
//         .fontSize(12)
//         .text(`Employee Name: ${dar.EmpDarEmpName}`);
//       doc
//         .font('Helvetica')
//         .fontSize(12)
//         .text(`Client Name: ${dar.EmpDarClientName}`);
//       doc
//         .font('Helvetica')
//         .fontSize(12)
//         .text(`Location Name: ${dar.EmpDarLocationName}`);
//       doc
//         .font('Helvetica')
//         .fontSize(12)
//         .text(`Shift Date: ${dar.EmpDarDate}`);
//       doc.moveDown();

//       // Employee DAR Tiles
//       if (dar.EmpDarTile) {
//         doc
//           .font('Helvetica-Bold')
//           .fontSize(12)
//           .text('Employee DAR Tiles:', { underline: true });
//         doc.moveDown();

//         dar.EmpDarTile.forEach((tile) => {
//           doc
//             .font('Helvetica-Bold')
//             .fontSize(10)
//             .text(`Tile Time: ${tile.TileTime}`);
//           doc
//             .font('Helvetica')
//             .fontSize(10)
//             .text(`Tile Content: ${tile.TileContent}`);
//           doc
//             .font('Helvetica')
//             .fontSize(10)
//             .text(`Tile Location: ${tile.TileLocation}`);
//           doc.moveDown();

//           // Tile Images
//           if (tile.TileImages && tile.TileImages.length > 0) {
//             doc.font('Helvetica-Bold').fontSize(10).text('Tile Images:');
//             doc.moveDown();

//             const imageWidth = 100; // Set the desired width of images
//             const imageHeight = 100; // Set the desired height of images

//             tile.TileImages.forEach((img) => {
//               doc
//                 .image(img, { width: imageWidth, height: imageHeight })
//                 .moveDown();
//             });
//             doc.moveDown();
//           }
//         });
//       }

//       // Add a page break after each employee's DAR data
//       doc.addPage();
//     });

//     // Finalize the PDF document
//     doc.end();

//     // Capture the PDF output in a buffer
//     const buffers: Buffer[] = [];
//     doc.on('data', (buffer) => buffers.push(buffer));
//     doc.on('end', () => {
//       const pdfBuffer = Buffer.concat(buffers);
//       const base64String = pdfBuffer.toString('base64');
//       resolve(base64String);
//     });

//     // Handle any errors that occur during PDF generation
//     doc.on('error', (err) => reject(err));
//   });
// }
