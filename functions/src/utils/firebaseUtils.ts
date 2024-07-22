import { Timestamp } from 'firebase-admin/firestore';
import {
  IClientsCollection,
  ICompaniesCollection,
  IEmployeeDARCollection,
  IEmployeesCollection,
  ILocationsCollection,
  IPatrolLogsCollection,
  IPatrolsCollection,
  IShiftsCollection,
} from '../@types/database';
import { CollectionName } from '../@types/enum';
import { securityAppAdmin } from '../methods/firebaseInit';
import { sendEmail } from '../notification/email';
import { generatePdfFromHtml } from './pdf/generatePdfFromHtml';
import dateFormat from 'dateformat';
import { format } from 'date-fns';
import { convertTimestampToDateOnly, formatDate } from './misc';

export const getCompanyDetails = async (cmpId: string) => {
  const cmpSnapshot = await securityAppAdmin
    .firestore()
    .doc(`${CollectionName.companies}/${cmpId}`)
    .get();
  return cmpSnapshot.data() as ICompaniesCollection;
};
export const getLocationDetails = async (locationId: string) => {
  const cmpSnapshot = await securityAppAdmin
    .firestore()
    .doc(`${CollectionName.locations}/${locationId}`)
    .get();
  return cmpSnapshot.data() as ICompaniesCollection;
};
export const getClientDetails = async (clientId: string) => {
  const cmpSnapshot = await securityAppAdmin
    .firestore()
    .doc(`${CollectionName.clients}/${clientId}`)
    .get();
  return cmpSnapshot.data() as IClientsCollection;
};
export const getClientDetailsByEmail = async (clientemail: string) => {
  const cmpSnapshot = await securityAppAdmin
    .firestore()
    .doc(`${CollectionName.clients}/${clientemail}`)
    .get();
  return cmpSnapshot.data() as IClientsCollection;
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

export const getShiftDocs = async (shiftId: string) => {
  const shiftSnapshot = await securityAppAdmin
    .firestore()
    .collection(CollectionName.shifts)
    .where('ShiftId', '==', shiftId)
    .get();
  return shiftSnapshot.docs.map((doc) => doc.data() as IShiftsCollection)[0];
};
// Fetching the patrol docs

export const getPatrolDocs = async (empId: string, shiftId: string) => {
  const darSnapshot = await securityAppAdmin
    .firestore()
    .collection('PatrolLogs')
    .where('PatrolLogGuardId', '==', empId)
    .where('PatrolShiftId', '==', shiftId)
    .orderBy('PatrolLogPatrolCount', 'asc')
    .get();
  return darSnapshot.docs.map((doc) => doc.data() as IPatrolLogsCollection);
};
//get PatrolName

export const getPatrolDetails = async (patrolId: string) => {
  const patrolDoc = await securityAppAdmin
    .firestore()
    .collection('Patrols')
    .doc(patrolId)
    .get();
  return patrolDoc.exists ? (patrolDoc.data() as IPatrolsCollection) : null;
};

export const getClientEmail = async (clientId: string) => {
  const clientDoc = await securityAppAdmin
    .firestore()
    .collection('Clients')
    .doc(clientId)
    .get();
  return clientDoc.exists
    ? (clientDoc.data() as { email: string }).email
    : null;
};

// Function to get LocationSendEmailForEachShift
export const getLocationSendEmailForEachShift = async (
  locationId: string
): Promise<boolean | null> => {
  const locationDoc = await securityAppAdmin
    .firestore()
    .collection('Locations')
    .doc(locationId)
    .get();
  return locationDoc.exists
    ? (locationDoc.data() as ILocationsCollection).LocationSendEmailForEachShift
    : null;
};

// Function to get LocationSendEmailToClient
export const getLocationSendEmailToClient = async (
  locationId: string
): Promise<boolean | null> => {
  const locationDoc = await securityAppAdmin
    .firestore()
    .collection('Locations')
    .doc(locationId)
    .get();
  return locationDoc.exists
    ? (locationDoc.data() as ILocationsCollection).LocationSendEmailToClient
    : null;
};

// Function to get LocationManagerEmail
export const getLocationManagerEmail = async (
  locationId: string
): Promise<string | null> => {
  const locationDoc = await securityAppAdmin
    .firestore()
    .collection('Locations')
    .doc(locationId)
    .get();
  return locationDoc.exists
    ? (locationDoc.data() as ILocationsCollection).LocationManagerEmail
    : null;
};

export const getPatrolName = async (patrolId: string): Promise<string[]> => {
  try {
    const darSnapshot = await securityAppAdmin
      .firestore()
      .collection('Patrols')
      .where('PatrolId', '==', patrolId)
      .get();

    if (darSnapshot.empty) {
      console.log('No matching documents.');
      return [];
    }

    return darSnapshot.docs.map((doc) => doc.data().PatrolName);
  } catch (error) {
    console.error('Error getting patrol documents: ', error);
    throw new Error('Error getting patrol documents');
  }
};
const isTimestamp = (value: any): value is Timestamp => {
  return value instanceof Timestamp;
};
const generateHtmlContent = (
  darData: IEmployeeDARCollection[],
  shiftInTime: string,
  shiftOutTime: string
): string => {
  if (!darData || darData.length === 0) {
    return '<html><body><h1>No DAR data available</h1></body></html>';
  }

  const dar = darData[0];
  const dar1 = darData.length > 1 ? darData[1] : null;
  let formattedDateStart = convertTimestampToDateOnly(dar.EmpDarCreatedAt);
  let formattedDateEnd = formattedDateStart;
  const employeeName = dar.EmpDarEmpName;

  if (dar1) {
    const formattedDate1 = convertTimestampToDateOnly(dar1.EmpDarCreatedAt);

    // Compare the dates and assign the smaller date to formattedDateStart
    if (formattedDate1 < formattedDateStart) {
      formattedDateEnd = formattedDateStart;
      formattedDateStart = formattedDate1;
    } else {
      formattedDateEnd = formattedDate1;
    }
  }

  console.log('Start Date:', formattedDateStart);
  console.log('End Date:', formattedDateEnd);

  return `
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
        width: 100%;
        max-width: 800px;
        margin: 20px auto;
        background: white;
        padding: 20px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .report-title {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
      }

      .header {
        width: 30%;
        margin-right: 10rem;
        padding-left: 2rem;
      }
      .sm-text {
        display: flex;
        justify-content: center;
        font-size: 12px;
        margin-top: -4%;
        margin-left: 3.5rem;
      }
      .report-header {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
      }
      .report-section {
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
      .report-section th,
      .report-section td {
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
        width: 100%;
        max-width: 100px;
        height: auto;
        display: block;
        margin: 0 auto;
        margin-top: 10px; /* Add margin between images */
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
        <img src="https://firebasestorage.googleapis.com/v0/b/livtech-dbcf2.appspot.com/o/companies%2Flogos%2FRl1LzaqY6u9boGrbNkEe_logo.jpg?alt=media&token=b4fe1e63-c136-4220-b0d7-dc47aee0cd85" alt="TPS Logo" width="100px" height="100px">
        <h1 class="header">Daily Activity Report</h1>
      </div>
      <p class="sm-text">EMPLOYEE REPORT</p>
      <div class="report-header">
        <div class="header-right">
          <p class="title">Employee Name: ${employeeName}</p>
          <p>Shift Start Time: ${shiftInTime}</p>
          <p>Shift Start Date: ${formattedDateStart}</p>
        </div>
        <div class="header-left">
          <p>Date: ${formattedDateStart}</p>
          <p>Shift End Time: ${shiftOutTime}</p>
          <p>Shift End Date: ${formattedDateEnd}</p>
        </div>
      </div>

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
                        <td>
                        Location: ${tile.TileLocation}<br>
                        Time: ${tile.TileTime}<br>
                        </td>
                        <td>
                            ${tile.TileContent}<br>
                            ${tile.TilePatrol?.length ? `<p>Patrol :-</p>${tile.TilePatrol.map((patrol) => `<a href="https://tacttik.com/patrolling_view?id=${patrol.TilePatrolId}">${patrol.TilePatrolName} - ${patrol.TilePatrolData}</a><br>`).join('')}` : ''}<br>
                            ${tile.TileReport?.length ? `<p>Report :-</p>${tile.TileReport.map((report) => `<a href="https://tacttik.com/report_view?id=${report.TileReportId}">${report.TileReportSearchId} - ${report.TileReportName}</a><br>`).join('')}` : ''}
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
  shiftStartTime: string,
  shiftEndTime: string,
  recipientEmail: string,
  shiftPosition: string,
  clientEmail: string,
  clientName: string
): Promise<void> => {
  const darData = await getDarDocs(empId, shiftId);
  console.log(darData);
  if (darData.length === 0) {
    console.log('No DAR documents found for the specified employee and shift.');
    return;
  }

  const htmlContent = generateHtmlContent(
    darData,
    shiftStartTime,
    shiftEndTime
  );
  const pdfBuffer = await generatePdfFromHtml(htmlContent);
  // const clientDetials = await getClientDetails(clientId);
  const recipientEmails = [
    'sutarvaibhav37@gmail.com',
    // 'Evan@york-construction.ca',
    // 'pankaj.kumar1312@yahoo.com',
    // 'dan@tpssolution.com',
    // 'sales@tpssolution.com',
    // ClientEmail,

    // nica@lestonholdings.com
  ];
  if (shiftPosition == 'GUARD') {
    // 'sutarvaibhav37@student.sfit.ac.in',
    recipientEmails.push(clientEmail);
    // recipientEmails.push('nica@lestonholdings.com');
  }
  const greeting =
    shiftPosition === 'MOBILE PATROLL' ? 'Dear Client,' : `Dear ${clientName},`;
  const htmltemplate = ` <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dar</title>
    </head>
    <body>
        <p>${greeting}

I hope this email finds you well. Attached, please find the Detailed Action Report (DAR) for your review and records.

Thank you for your attention 
</p>  
 <p>Best regards,</p>
        <p>Tactical protection solutions ltd.</p>
    </body>
    </html>`;
  if (pdfBuffer) {
    for (const email of recipientEmails) {
      await sendEmail({
        from_name: 'DAR Report',
        subject: 'DAR Report',
        to_email: email,
        html: htmltemplate,
        attachments: [
          {
            filename: 'DAR.pdf',
            content: pdfBuffer as unknown as string,
            contentType: 'application/pdf',
          },
        ],
      });
    }
    console.log(' ${email} Email sent successfully.');
  }
};
