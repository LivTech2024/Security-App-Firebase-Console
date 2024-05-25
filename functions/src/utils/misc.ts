import dayjs from 'dayjs';
import { Timestamp } from 'firebase-admin/firestore';

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
