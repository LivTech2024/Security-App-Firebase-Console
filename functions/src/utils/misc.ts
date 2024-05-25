function findRemovedElements<T>(oldArray: T[], newArray: T[]): T[] {
  const newSet = new Set(newArray);
  const removedElements = oldArray.filter((element) => !newSet.has(element));
  return removedElements;
}
