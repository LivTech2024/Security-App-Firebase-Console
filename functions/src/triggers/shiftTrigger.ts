/* eslint-disable max-len */
import * as functions from 'firebase-functions';
import { securityAppAdmin } from '../methods/firebaseInit';
import axios from 'axios';
import { IShiftsCollection } from '../@types/database';
import { CollectionName } from '../@types/enum';

export const shiftAssign = functions.firestore
  .document(CollectionName.shifts + '/ShiftId')
  .onUpdate(async (snap) => {
    try {
      const shiftOldData = snap.before.data() as IShiftsCollection;
      const { ShiftAssignedUserId: oldAssignedUsers } = shiftOldData;
      const shiftNewData = snap.after.data() as IShiftsCollection;
      const {
        ShiftDate,
        ShiftStartTime,
        ShiftEndTime,
        ShiftLocationAddress,
        ShiftName,
        ShiftAssignedUserId,
        ShiftCompanyId,
      } = shiftNewData;

      //* This is to send mail to assigned users
      if (
        oldAssignedUsers.length !== ShiftAssignedUserId.length ||
        !oldAssignedUsers.every(
          (value, index) => value === ShiftAssignedUserId[index]
        )
      ) {
        //* Fetch company
        const cmpSnapshot = await securityAppAdmin
          .firestore()
          .doc(`${CollectionName.companies}/${ShiftCompanyId}`)
          .get();
        const companyData = cmpSnapshot.data();

        const companyName: string = companyData?.CompanyName;

        if (ShiftAssignedUserId && ShiftAssignedUserId.length > 0) {
          await Promise.all(
            ShiftAssignedUserId.map(async (id) => {
              const empSnapshot = await securityAppAdmin
                .firestore()
                .collection(CollectionName.employees)
                .where('EmployeeId', '==', id)
                .limit(1)
                .get();

              const empData = empSnapshot?.docs[0]?.data();

              if (empData) {
                const empEmail = empData?.EmployeeEmail;
                if (empEmail) {
                  await axios.post(
                    'https://backend-sceurity-app.onrender.com/api/send_email',
                    {
                      from_name: companyName,
                      subject: 'Your schedule update',
                      to_email: empEmail,
                      text: `You have been assigned for the following shift.\n Shift Name: ${ShiftName} \n Date: ${ShiftDate} \n Timing: ${ShiftStartTime}-${ShiftEndTime} \n Address: ${ShiftLocationAddress}`,
                    }
                  );
                }
              }
            })
          );
        }
      }
    } catch (error) {
      console.log(error);
    }
  });
