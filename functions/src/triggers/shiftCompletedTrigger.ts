/* eslint-disable max-len */
import * as functions from 'firebase-functions';
import { IShiftsCollection } from '../@types/database';
import { CollectionName } from '../@types/enum';
import axios from 'axios';
import { securityAppAdmin } from '../methods/firebaseInit';

export const shiftStatusUpdate = functions.firestore
  .document(CollectionName.shifts + '/{ShiftId}')
  .onUpdate(async (snap) => {
    try {
      const shiftOldData = snap.before.data() as IShiftsCollection;
      const shiftNewData = snap.after.data() as IShiftsCollection;

      const {
        ShiftDate,
        ShiftStartTime,
        ShiftEndTime,
        ShiftLocationAddress,
        ShiftName,
        ShiftAssignedUserId,
        ShiftCompanyId,
        ShiftCurrentStatus,
      } = shiftNewData;

      // Check if the ShiftCurrentStatus has a status "started"
      const oldStatusStarted = shiftOldData?.ShiftCurrentStatus?.some(
        (status) => status.Status === 'started'
      );

      const newStatusCompleted = ShiftCurrentStatus?.some(
        (status) => status.Status === 'completed'
      );

      // Log the old and new statuses
      console.log('Old ShiftCurrentStatus:', shiftOldData?.ShiftCurrentStatus);
      console.log('New ShiftCurrentStatus:', ShiftCurrentStatus);

      // Proceed if the status changed from "started" to "completed"
      if (oldStatusStarted && newStatusCompleted) {
        console.log('Status changed from "started" to "completed"');

        // Find the status entry with "completed"
        const completedStatus = ShiftCurrentStatus.find(
          (status) => status.Status === 'completed'
        );

        if (completedStatus) {
          const { StatusReportedById, StatusReportedByName } = completedStatus;

          // Log the details of the completed status
          console.log('Completed Status:', completedStatus);

          // Fetch company
          const cmpSnapshot = await securityAppAdmin
            .firestore()
            .doc(`${CollectionName.companies}/${ShiftCompanyId}`)
            .get();
          const companyData = cmpSnapshot.data();

          const companyName: string = companyData?.CompanyName;

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
                  console.log(`Sending email to: ${empEmail}`);
                  await axios.post(
                    'https://backend-sceurity-app-rbbz.onrender.com/api/send_email',
                    {
                      from_name: companyName,
                      subject: 'Shift Status Update',
                      to_email: empEmail,
                      text: `The status of your assigned shift has been updated to completed.\n Shift Name: ${ShiftName} \n Date: ${ShiftDate} \n Timing: ${ShiftStartTime}-${ShiftEndTime} \n Address: ${ShiftLocationAddress} \n Updated By: ${StatusReportedByName}`,
                    }
                  );
                }
              }
            })
          );
        }
      } else {
        console.log('No relevant status change detected');
      }
    } catch (error) {
      console.log(error);
    }
  });
