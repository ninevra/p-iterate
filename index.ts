type State<T> =
  | { label: 'accumulating'; values: T[] }
  | {
      label: 'yielded';
      resolve: (value: T) => void;
      reject: (reason: unknown) => void;
    }
  | { label: 'rejected'; reason: unknown };

export async function* pIter<T>(
  promises: Iterable<Promise<T>>
): AsyncGenerator<T, void, undefined> {
  // Typescript incorrectly narrows `state` on the assumption that it doesn't
  // leak, so we manually widen it to its full type range.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  let state = { label: 'accumulating', values: [] } as State<T>;
  let count = 0;
  for (const promise of promises) {
    count++;
    /* eslint-disable @typescript-eslint/no-loop-func */
    promise
      .then((value) => {
        if (state.label === 'yielded') {
          state.resolve(value);
          state = { label: 'accumulating', values: [] };
        } else if (state.label === 'accumulating') {
          state.values.push(value);
        }
      })
      .catch((error: unknown) => {
        if (state.label === 'yielded') {
          state.reject(error);
        } else if (state.label === 'accumulating') {
          state = { label: 'rejected', reason: error };
        }
      });
    /* eslint-enable @typescript-eslint/no-loop-func */
  }

  while (count > 0) {
    count--;

    if (state.label === 'rejected') {
      throw state.reason;
    } else if (state.label === 'accumulating') {
      if (state.values.length > 0) {
        yield state.values.pop()!;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        yield new Promise<T>((resolve, reject) => {
          state = { label: 'yielded', resolve, reject };
        });
      }
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
): AsyncGenerator<
  PromiseSettledResult<T> & { index: number },
  void,
  undefined
> {
  yield* pIter(
    map(promises, async (promise, index) => ({
      index,
      ...(await settling(promise)),
    }))
  );
}

export async function* pIterEnumerated<T>(
  promises: Iterable<Promise<T>>
): AsyncGenerator<[number, T], void, undefined> {
  yield* pIter(
    map(promises, async (promise, index) =>
      promise.then((value) => [index, value])
    )
  );
}
