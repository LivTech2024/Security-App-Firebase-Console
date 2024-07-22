import dayjs from 'dayjs';
import { Timestamp } from 'firebase-admin/firestore';
import utc from 'dayjs/plugin/utc';
import { format, toZonedTime } from 'date-fns-tz';
// import { DateTime } from 'luxon';

import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

const tz = 'America/Toronto';

export function findRemovedElements<T>(oldArray: T[], newArray: T[]): T[] {
  const newSet = new Set(newArray);
  const removedElements = oldArray.filter((element) => !newSet.has(element));
  return removedElements;
}

export const toDate = (value: any): Date => {
  if (value instanceof Date) {
    return value;
  } else if (value instanceof Timestamp) {
    return value.toDate();
  } else if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  } else {
    throw new TypeError('Invalid date value');
  }
};

export const removeTimeFromDate = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const formatDate = (dateText: any, dateFormat = 'DD MMM-YY') => {
  const date = toDate(dateText);
  return dayjs(date).format(dateFormat);
};
// export const formatTIME = (dateText: any, timeFormat = 'HH:mm:ss') => {
//   console.log('formatDate called with:', dateText);

//   // Parse the dateText to a DateTime object using Luxon
//   const date = DateTime.fromISO(dateText, { zone: 'UTC' });

//   console.log('Formatted from timezone to date:', date.toString());

//   // Convert to the Canada/Toronto timezone
//   const torontoTime = date.setZone('America/Toronto');

//   console.log('Toronto Time:', torontoTime.toString());

//   // Extract the time portion using dayjs
//   const formattedTime = dayjs(torontoTime.toISO()).format(timeFormat);
//   console.log('Formatted time:', formattedTime);

//   return formattedTime;
// };
// export function convertTimestampToDate(timestamp: Timestamp | any): Date | any {
//   return timestamp instanceof Timestamp
//     ? new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate()
//     : timestamp;
// }
export function convertTimestampToDate(
  timestamp: Timestamp | any
): string | any {
  // Check if the input is a Firebase Timestamp
  const date =
    timestamp instanceof Timestamp
      ? new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate()
      : timestamp;

  // Convert the date to the America/Toronto timezone
  const torontoTime = toZonedTime(date, 'America/Edmonton');

  // Format the date to get only the time portion (e.g., 'HH:mm:ss')
  const formattedTime = format(torontoTime, 'HH:mm:ss', {
    timeZone: 'America/Edmonton',
  });

  return formattedTime;
}
export function convertTimestampToDateOnly(
  timestamp: Timestamp | any
): string | any {
  // Check if the input is a Firebase Timestamp
  const date =
    timestamp instanceof Timestamp
      ? new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate()
      : timestamp;

  // Convert the date to the America/Edmonton timezone
  const edmontonTime = toZonedTime(date, 'America/Edmonton');

  // Format the date to get only the date portion (e.g., '09 Jun-24')
  const formattedDate = format(edmontonTime, 'dd MMM-yy', {
    timeZone: 'America/Edmonton',
  });

  return formattedDate;
}
