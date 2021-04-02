export async function* pIter<T>(
  promises: Iterable<Promise<T>>
): AsyncGenerator<T> {
  const values: T[] = [];
  let outstanding:
    | { resolve: (value: T) => void; reject: (reason: unknown) => void }
    | undefined;
  let count = 0;
  let rejection: { reason: unknown } | undefined;
  for (const promise of promises) {
    count++;
    /* eslint-disable @typescript-eslint/no-loop-func */
    promise
      .then((value) => {
        if (outstanding) {
          outstanding.resolve(value);
          outstanding = undefined;
        } else {
          values.push(value);
        }
      })
      .catch((error: unknown) => {
        if (outstanding) {
          outstanding.reject(error);
          outstanding = undefined;
        } else {
          rejection = { reason: error };
        }
      });
    /* eslint-enable @typescript-eslint/no-loop-func */
  }

  while (count > 0) {
    if (rejection) {
      throw rejection.reason;
    }

    count--;
    if (values.length > 0) {
      yield values.pop()!;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      yield new Promise<T>((resolve, reject) => {
        outstanding = { resolve, reject };
      });
    }
  }
}

function* map<T, U>(
  iterable: Iterable<T>,
  fn: (item: T, index: number) => U
): Iterable<U> {
  let index = 0;
  for (const item of iterable) {
    yield fn(item, index++);
  }
}

async function settling<T>(
  promise: Promise<T>
): Promise<PromiseSettledResult<T>> {
  try {
    return { status: 'fulfilled', value: await promise };
  } catch (error: unknown) {
    return { status: 'rejected', reason: error };
  }
}

export async function* pIterSettled<T>(
  promises: Iterable<Promise<T>>
): AsyncGenerator<PromiseSettledResult<T> & { index: number }> {
  yield* pIter(
    map(promises, async (promise, index) => ({
      index,
      ...(await settling(promise)),
    }))
  );
}

export async function* pIterEnumerated<T>(
  promises: Iterable<Promise<T>>
): AsyncGenerator<[number, T]> {
  yield* pIter(
    map(promises, async (promise, index) =>
      promise.then((value) => [index, value])
    )
  );
}
