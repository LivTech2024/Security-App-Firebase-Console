import * as functions from 'firebase-functions';
import { CollectionName } from '../@types/enum';
import {
  ILoggedInUsersCollection,
  INotificationData,
  IShiftExchangeCollection,
  IShiftsCollection,
} from '../@types/database';
import { firestore } from 'firebase-admin';
import { sendFCMNotification } from '../notification/fcm';
import { BaseMessage } from 'firebase-admin/lib/messaging/messaging-api';
import { Timestamp } from 'firebase-admin/firestore';
import { getEmpDetails, getShiftDocs } from '../utils/firebaseUtils';

// Function triggered on creating or updating a shift exchange request
export const shiftExchangeHandler = functions.firestore
  .document(`${CollectionName.shiftexchange}/{ShiftExchReqId}`)
  .onWrite(async (change, context) => {
    try {
      const shiftExchangeData = change.after.exists
        ? (change.after.data() as IShiftExchangeCollection)
        : null;
      const previousShiftExchangeData = change.before.exists
        ? (change.before.data() as IShiftExchangeCollection)
        : null;

      if (!shiftExchangeData) {
        // Document has been deleted
        return;
      }

      const {
        ShiftExchReqId,
        ShiftExchReqCreatedAt,
        ShiftExchReqReceiverId,
        ShiftExchSenderShiftId,
        ShiftExchReceiverShiftId,
        ShiftExchReqSenderId,
        ShiftExchShiftDate,
        ShiftExchReqStatus,
      } = shiftExchangeData;

      if (
        previousShiftExchangeData &&
        previousShiftExchangeData.ShiftExchReqStatus === 'pending' &&
        ShiftExchReqStatus === 'completed'
      ) {
        // Status changed from 'pending' to 'completed', swap the assigned users for the shifts
        await swapShiftAssignedUsers(
          ShiftExchReceiverShiftId,
          ShiftExchReqSenderId,
          ShiftExchReqReceiverId,
          ShiftExchSenderShiftId
        );
        return;
      }

      // If the status is not changed to completed, create the notification
      const shiftData = await getShiftDocs(ShiftExchSenderShiftId);
      const empData = await getEmpDetails(ShiftExchReqSenderId);

      const notificationData: INotificationData = {
        NotificationMessage: 'New Shift Exchange Request',
        NotificationCreatedAt: ShiftExchReqCreatedAt,
        NotificationType: 'SHIFTEXCHANGE',
        NotificationStatus: shiftExchangeData.ShiftExchReqStatus,
        NotificationIds: [ShiftExchReqReceiverId],
        NotificationId: '', // Temporary placeholder
        NotificationCompanyId: empData.EmployeeCompanyId,
        NotificationSenderName: empData.EmployeeName,
        ShiftExchangeData: {
          ExchangeShiftId: ShiftExchSenderShiftId,
          ExchangeShiftTime: `${shiftData.ShiftStartTime} - ${shiftData.ShiftEndTime}`,
          ExchangeShiftDate: ShiftExchShiftDate,
          ExchangeShiftLocation:
            shiftData.ShiftLocationName ?? 'Unknown Location',
          ExchangeShiftRequestedId: ShiftExchReqId,
          ExchangeShiftRequestedName: empData.EmployeeName,
          ExchangeShiftName: shiftData.ShiftName,
        },
      };

      const notificationRef = firestore()
        .collection(CollectionName.notification)
        .doc();

      notificationData.NotificationId = notificationRef.id;

      await notificationRef.set(notificationData);
    } catch (error) {
      console.error('Error handling shift exchange:', error);
    }
  });

// Function to swap assigned users for two shifts
async function swapShiftAssignedUsers(
  ShiftExchReceiverShiftId: string,
  ShiftExchReqSenderId: string,
  ShiftExchReqReceiverId: string,
  ShiftExchSenderShiftId: string
) {
  try {
    await firestore().runTransaction(async (transaction) => {
      const receiverShiftDocRef = firestore()
        .collection(CollectionName.shifts)
        .doc(ShiftExchReceiverShiftId);
      const senderShiftDocRef = firestore()
        .collection(CollectionName.shifts)
        .doc(ShiftExchSenderShiftId);

      const receiverShiftDoc = await transaction.get(receiverShiftDocRef);
      const senderShiftDoc = await transaction.get(senderShiftDocRef);

      if (!receiverShiftDoc.exists || !senderShiftDoc.exists) {
        throw new Error('One or both shifts do not exist!');
      }

      const receiverShiftData = receiverShiftDoc.data() as IShiftsCollection;
      const senderShiftData = senderShiftDoc.data() as IShiftsCollection;

      // Swap ShiftAssignedUserId
      const receiverIndex = receiverShiftData.ShiftAssignedUserId.indexOf(
        ShiftExchReqReceiverId
      );
      const senderIndex =
        senderShiftData.ShiftAssignedUserId.indexOf(ShiftExchReqSenderId);

      if (receiverIndex !== -1) {
        receiverShiftData.ShiftAssignedUserId[receiverIndex] =
          ShiftExchReqSenderId;
      }

      if (senderIndex !== -1) {
        senderShiftData.ShiftAssignedUserId[senderIndex] =
          ShiftExchReqReceiverId;
      }

      transaction.update(receiverShiftDocRef, {
        ShiftAssignedUserId: receiverShiftData.ShiftAssignedUserId,
        ShiftModifiedAt: firestore.Timestamp.fromDate(new Date()),
      });

      transaction.update(senderShiftDocRef, {
        ShiftAssignedUserId: senderShiftData.ShiftAssignedUserId,
        ShiftModifiedAt: firestore.Timestamp.fromDate(new Date()),
      });
    });
    console.log('ShiftAssignedUserId swapped successfully');
  } catch (error) {
    console.error('Error swapping ShiftAssignedUserId:', error);
  }
}
