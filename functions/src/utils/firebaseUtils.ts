import {
  ICompaniesCollection,
  IEmployeeDARCollection,
  IEmployeesCollection,
} from '../@types/database';
import { CollectionName } from '../@types/enum';
import { securityAppAdmin } from '../methods/firebaseInit';
import { sendEmail } from '../notification/email';
import { generatePdf, generatePdfFromDarData } from '../pdf/genPdf';

export const getCompanyDetails = async (cmpId: string) => {
  const cmpSnapshot = await securityAppAdmin
    .firestore()
    .doc(`${CollectionName.companies}/${cmpId}`)
    .get();
  return cmpSnapshot.data() as ICompaniesCollection;
};

export const getEmpDetails = async (empId: string) => {
  const empSnapshot = await securityAppAdmin
    .firestore()
    .doc(`${CollectionName.employees}/${empId}`)
    .get();

  return empSnapshot?.data() as IEmployeesCollection;
};
// get Dar Details
export const getDarDocs = async (empId: string, shiftId: string) => {
  const darSnapshot = await securityAppAdmin
    .firestore()
    .collection('EmployeesDAR')
    .where('EmpDarEmpId', '==', empId)
    .where('EmpDarShiftId', '==', shiftId)
    .get();
  return darSnapshot.docs.map((doc) => doc.data() as IEmployeeDARCollection);
};
const generateHtmlContent = (darData: IEmployeeDARCollection[]): string => {
  if (!darData || darData.length === 0) {
    return '<html><body><h1>No DAR data available</h1></body></html>';
  }

  const dar = darData[0]; // Assuming you want to use the first DAR entry for the header information
  const employeeName = dar.EmpDarEmpName;
  const date = dar.EmpDarDate;
  const shiftStartTime = '19:00'; // Replace with actual data if available
  const shiftEndTime = '07:00'; // Replace with actual data if available
  const shiftStartDate = date; // Replace with actual data if available
  const shiftEndDate = dar.EmpDarDate;
  // Example for next day

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Activity Report</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                background-color: #f4f4f4;
            }
            .report-container {
                max-width: 800px;
                margin: 20px auto;
                background: white;
                padding: 20px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .report-header, .report-section {
                width: 100%;
                border-collapse: collapse;
            }
            .report-header td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            .report-header td.title {
                text-align: center;
                font-weight: bold;
                background-color: #f4b400;
                color: white;
            }
            .report-section th, .report-section td {
                border: 1px solid #ddd;
                padding: 8px;
            }
            .report-section th {
                background-color: #f4b400;
                color: white;
            }
            .report-section td {
                vertical-align: top;
            }
            .report-section td img {
                width: 100px;
                height: auto;
            }
            .report-title {
                text-align: center;
                margin-bottom: 20px;
            }
            .report-title img {
                width: 100px;
            }
        </style>
    </head>
    <body>
        <div class="report-container">
            <div class="report-title">
                <img src="logo.png" alt="TPS Logo">
                <h1>Daily Activity Report</h1>
            </div>
            <table class="report-header">
                <tr>
                    <td class="title">Employee Name: ${employeeName}</td>
                    <td>Date: ${date}</td>
                </tr>
                <tr>
                    <td>Shift Start Time: ${shiftStartTime}</td>
                    <td>Shift End Time: ${shiftEndTime}</td>
                </tr>
                <tr>
                    <td>Shift Start Date: ${shiftStartDate}</td>
                    <td>Shift End Date: ${shiftEndDate}</td>
                </tr>
            </table>
            <table class="report-section">
                <tr>
                    <th>Place/Spot</th>
                    <th>Description</th>
                    <th>Images</th>
                </tr>
                ${darData
                  .map(
                    (dar) => `
                  ${dar.EmpDarTile?.map(
                    (tile) => `
                    <tr>
                        <td>${tile.TileLocation}</td>
                        <td>
                            Date: ${new Date(tile.TileTime).toLocaleDateString()}<br>
                            Time: ${new Date(tile.TileTime).toLocaleTimeString()}<br>
                            ${tile.TileContent}
                        </td>
                        <td>${tile.TileImages?.map((img) => `<img src="${img}" alt="Image">`).join('') || ''}</td>
                    </tr>
                  `
                  ).join('')}
                `
                  )
                  .join('')}
            </table>
        </div>
    </body>
    </html>
  `;
};

export const processAndSendEmployeeDARReport = async (
  empId: string,
  shiftId: string,
  recipientEmail: string
): Promise<void> => {
  const darData = await getDarDocs(empId, shiftId);
  console.log(darData);
  if (darData.length === 0) {
    console.log('No DAR documents found for the specified employee and shift.');
    return;
  }

  const htmlContent = generateHtmlContent(darData);
  const pdfBuffer = await generatePdf(htmlContent);
  await sendEmail({
    from_name: 'Testing Dar',
    subject: 'DAR Report',
    to_email: 'sutarvaibhav37@gmail.com',
    attachments: [
      {
        filename: 'DAR.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
  console.log('Email sent successfully.');
};
