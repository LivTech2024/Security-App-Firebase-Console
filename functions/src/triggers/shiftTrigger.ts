/* eslint-disable max-len */
import * as functions from 'firebase-functions';
import { IShiftsCollection } from '../@types/database';
import { CollectionName } from '../@types/enum';
import { sendEmail } from '../notification/email';
import { getCompanyDetails, getEmpDetails } from '../utils/firebaseUtils';
import { findRemovedElements } from '../utils/misc';

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
          await sendEmail({
            from_name: CompanyName,
            subject: 'Your schedule update',
            to_email: EmployeeEmail,
            text: `You have been removed from the shift.\n Shift Name: ${ShiftName} \n Date: ${ShiftDate} \n Timing: ${ShiftStartTime}-${ShiftEndTime} \n Address: ${ShiftLocationAddress || 'N/A'}`,
          });
        }
      })
    );
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
    } catch (error) {
      console.log(error);
    }
  });
