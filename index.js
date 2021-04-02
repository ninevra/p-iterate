export async function* pIter(promises) {
  const values = [];
  let outstanding;
  let count = 0;
  let rejection;
  for (const promise of promises) {
    count++;
    promise
      .then((value) => {
        if (outstanding) {
          outstanding.resolve(value);
          outstanding = undefined;
        } else {
          values.push(value);
        }
      })
      .catch((error) => {
        if (outstanding) {
          outstanding.reject(error);
          outstanding = undefined;
        } else {
          rejection = { reason: error };
        }
      });
  }

  while (count > 0) {
    if (rejection) {
      throw rejection.reason;
    }

    count--;
    if (values.length > 0) {
      yield values.pop();
    } else {
      yield new Promise((resolve, reject) => {
        outstanding = { resolve, reject };
      });
    }
  }
}

function* map(iterable, fn) {
  for (const item of iterable) {
    yield fn(item);
  }
}

export async function* pIterSettled(promises) {
  yield* pIter(
    map(promises, (promise) =>
      promise
        .then((value) => ({ status: 'fulfilled', value }))
        .catch((error) => ({ status: 'rejected', reason: error }))
    )
  );
}
