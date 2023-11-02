// The create method will only be called once
const memo = <T extends ((...args: any[]) => NonNullable<any>)>(create: T) => {
  let value: ReturnType<T> | null = null
  let didCall = false

  return (...args: Parameters<typeof create>): ReturnType<T> => {
    if (!didCall) {
      value = create(...args)
      didCall = true
    }
    return value!
  }
}

export {
  memo,
}
