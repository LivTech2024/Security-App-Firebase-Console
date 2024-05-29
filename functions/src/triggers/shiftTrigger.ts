/* eslint-disable max-len */
import * as functions from 'firebase-functions';
import { IShiftsCollection } from '../@types/database';
import { CollectionName } from '../@types/enum';
import { sendEmail } from '../notification/email';
import {
  getCompanyDetails,
  getEmpDetails,
  processAndSendEmployeeDARReport,
} from '../utils/firebaseUtils';
import { findRemovedElements, formatDate } from '../utils/misc';

//* Trigger tasks
const sendEmailToEmpWhoHasBeenRemovedFromShift = async (
  shiftOldData: IShiftsCollection,
  shiftNewData: IShiftsCollection
) => {
  const {
    ShiftAssignedUserId: oldUserIds,
    ShiftName,
    ShiftDate,
    ShiftStartTime,
    ShiftEndTime,
    ShiftLocationAddress,
  } = shiftOldData;
  const { ShiftAssignedUserId: newUserIds, ShiftCompanyId } = shiftNewData;

  const empRemovedIds = findRemovedElements(oldUserIds, newUserIds);

  if (empRemovedIds && empRemovedIds.length > 0) {
    const companyDetails = await getCompanyDetails(ShiftCompanyId);
    const { CompanyName } = companyDetails;

    await Promise.all(
      empRemovedIds.map(async (empId) => {
        const empDetails = await getEmpDetails(empId);

        if (empDetails) {
          const { EmployeeEmail } = empDetails;
          functions.logger.log('Sending Email to-> ', EmployeeEmail);
          await sendEmail({
            from_name: CompanyName,
            subject: 'Your schedule update',
            to_email: EmployeeEmail,
            text: `You have been removed from the shift.\n Shift Name: ${ShiftName} \n Date: ${formatDate(ShiftDate)} \n Timing: ${ShiftStartTime}-${ShiftEndTime} \n Address: ${ShiftLocationAddress || 'N/A'}`,
          });
        }
      })
    );
  }
};
//Send Dar and Report on Shift Complete trigger
export const sendEmailToEmpWhoHasCompletedShift = async (
  shiftOldData: IShiftsCollection,
  shiftNewData: IShiftsCollection
): Promise<void> => {
  const {
    ShiftAssignedUserId: oldUserIds,
    ShiftName,
    ShiftDate,
    ShiftStartTime,
    ShiftEndTime,
    ShiftLocationAddress,
    ShiftCurrentStatus,
    ShiftId,
    ShiftCompanyId,
  } = shiftOldData;

  const oldStatusStarted = shiftOldData.ShiftCurrentStatus?.some(
    (status) => status.Status === 'started'
  );

  const newStatusCompleted = shiftNewData.ShiftCurrentStatus?.some(
    (status) => status.Status === 'completed'
  );

  if (oldStatusStarted && newStatusCompleted) {
    console.log('Status changed from "started" to "completed"');

    // Find the status entry with "completed"
    const completedStatus = shiftNewData.ShiftCurrentStatus.find(
      (status) => status.Status === 'completed'
    );
    if (completedStatus) {
      const { StatusReportedById, StatusReportedByName } = completedStatus;
      const companyDetails = await getCompanyDetails(ShiftCompanyId);
      const { CompanyName } = companyDetails;

      if (StatusReportedById) {
        const empDetails = await getEmpDetails(StatusReportedById);

        if (empDetails) {
          const { EmployeeEmail } = empDetails;
          await processAndSendEmployeeDARReport(
            StatusReportedById,
            ShiftId,
            EmployeeEmail
          );
          console.log('Sending Email to-> ', EmployeeEmail);
          await sendEmail({
            from_name: CompanyName,
            subject: 'Your Shift Completed',
            to_email: EmployeeEmail,
            text: `Shift Completed Trigger.\n Shift Name: ${ShiftName} \n Date: ${ShiftDate} \n Timing: ${ShiftStartTime}-${ShiftEndTime} \n Address: ${ShiftLocationAddress || 'N/A'}`,
          });
        }
      }
    }
  }
};

export const shiftUpdate = functions.firestore
  .document(CollectionName.shifts + '/{ShiftId}')
  .onUpdate(async (snap) => {
    try {
      const shiftOldData = snap?.before?.data() as IShiftsCollection;

      const shiftNewData = snap.after.data() as IShiftsCollection;

      //* To send email to employees who have been removed from a shift
      await sendEmailToEmpWhoHasBeenRemovedFromShift(
        shiftOldData,
        shiftNewData
      );
      await sendEmailToEmpWhoHasCompletedShift(shiftOldData, shiftNewData);
    } catch (error) {
      console.log(error);
    }
  });
