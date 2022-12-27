/* #move - Moves an array item from one position in an array to another.
     Note: This is a pure function so a new array will be returned, instead
     of altering the array argument.
    Arguments:
    1. array     (String) : Array in which to move an item.         (required)
    2. moveIndex (Object) : The index of the item to move.          (required)
    3. toIndex   (Object) : The index to move item at moveIndex to. (required)
  */
export function move<T>(array: T[], moveIndex: number, toIndex: number) {
  const item = array[moveIndex]
  const length = array.length
  const diff = moveIndex - toIndex

  if (diff > 0) {
    // move left
    return [
      ...array.slice(0, toIndex),
      item,
      ...array.slice(toIndex, moveIndex),
      ...array.slice(moveIndex + 1, length),
    ] as T[]
  } else if (diff < 0) {
    // move right
    const targetIndex = toIndex + 1
    return [
      ...array.slice(0, moveIndex),
      ...array.slice(moveIndex + 1, targetIndex),
      item,
      ...array.slice(targetIndex, length),
    ] as T[]
  }
  return array
}

export function swap<T>(array: T[], a: number, b: number) {
  const tempArray = Array.from(array)
  if (a < 0 || a >= array.length || b < 0 || b >= array.length) {
    return tempArray
  }
  const temp = tempArray[a] as T
  tempArray[a] = tempArray[b] as T
  tempArray[b] = temp
  return tempArray
}
