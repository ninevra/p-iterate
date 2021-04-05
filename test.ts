import test, { ExecutionContext, EitherMacro } from 'ava';
import { pIter, pIterSettled, pIterEnumerated } from './index.js';

function* range(start: number, stop: number): Generator<number> {
  while (start < stop) {
    yield start++;
  }
}

function* map<T, U>(source: Iterable<T>, fn: (t: T) => U): Generator<U> {
  for (const item of source) {
    yield fn(item);
  }
}

type PromiseSettlers<T> = {
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

type Trigger<T> = PromiseSettlers<T> & {
  promise: Promise<T>;
};

function trigger<T>(): Trigger<T> {
  let ops: PromiseSettlers<T>;
  const promise = new Promise<T>((resolve, reject) => {
    ops = { resolve, reject };
  });
  return { promise, ...ops! };
}

async function immediate(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

test('pIter() yields values in the order they fulfill', async (t) => {
  const triggers = [...range(0, 10)].map(() => trigger<number>());
  const asyncIterable = pIter(triggers.map(async ({ promise }) => promise));
  const yielded: number[] = [];
  const iteration = (async () => {
    for await (const value of asyncIterable) {
      yielded.push(value);
    }
  })();
  const expected = [5, 4, 7, 2, 1, 9, 8, 0, 3, 6];
  for (const value of expected) {
    await immediate(); // eslint-disable-line no-await-in-loop
    triggers[value]!.resolve(value);
  }

  await iteration;
  t.deepEqual(yielded, expected);
});

test('pIter() accepts an iterable', async (t) => {
  const expected = new Set(range(0, 100));
  for await (const value of pIter(map(range(0, 100), async (n) => n))) {
    t.true(expected.has(value));
    t.true(expected.delete(value));
  }

  t.is(expected.size, 0);
});

test('pIter() rejects with the reason of the first promise to reject', async (t) => {
  const triggers = [
    trigger<number>(),
    trigger<number>(),
    trigger<number>(),
  ] as const;
  const asyncIterable = pIter(triggers.map(async ({ promise }) => promise));
  const yielded: number[] = [];
  let rejection: unknown;
  const iteration = (async () => {
    try {
      for await (const value of asyncIterable) {
        yielded.push(value);
      }
    } catch (error: unknown) {
      rejection = error;
    }
  })();
  triggers[1].resolve(1);
  await immediate();
  triggers[0].reject(0);
  await immediate();
  triggers[2].resolve(2);
  await immediate();
  await iteration;
  t.deepEqual(yielded, [1]);
  t.is(rejection, 0);
  t.deepEqual(await asyncIterable.next(), { done: true, value: undefined });
});

async function consumeAsync(
  asyncIterable: AsyncIterable<unknown>
): Promise<void> {
  // @ts-expect-error
  // eslint-disable-next-line no-empty
  for await (const value of asyncIterable) {
  }
}

test('pIter() rejects', async (t) => {
  try {
    await consumeAsync(
      // eslint-disable-next-line prefer-promise-reject-errors
      pIter([Promise.resolve(1), Promise.reject(2), Promise.resolve(3)])
    );

    t.fail();
  } catch (error: unknown) {
    t.is(error, 2);
  }
});

async function passes<Context>(
  t: ExecutionContext<Context>,
  work: EitherMacro<[], Context> // eslint-disable-line @typescript-eslint/ban-types
): Promise<boolean> {
  const attempt = await t.try(work);
  attempt.discard();
  return attempt.passed;
}

test('pIterSettled() iterates over the settled states of the input', async (t) => {
  // eslint-disable-next-line prefer-promise-reject-errors
  const input = [Promise.resolve(1), Promise.reject(2), Promise.resolve(3)];
  const expected = (
    await Promise.allSettled(input)
  ).map((expectation, index) => ({ index, ...expectation }));
  const received = [];
  for await (const item of pIterSettled(input)) {
    received.push(item);
    t.true(
      (
        await Promise.all(
          expected.map(async (expectation) =>
            passes(t, (t) => t.deepEqual(item, expectation))
          )
        )
      ).some((v) => v)
    );
  }

  t.is(received.length, input.length);
});

test('pIterEnumerated() yields values and indices in the order they fulfill', async (t) => {
  const triggers = [...range(0, 10)].map(() => trigger<string>());
  const asyncIterable = pIterEnumerated(
    triggers.map(async ({ promise }) => promise)
  );
  const yielded: Array<[number, string]> = [];
  const iteration = (async () => {
    for await (const value of asyncIterable) {
      yielded.push(value);
    }
  })();
  const expected: Array<[number, string]> = [];
  for (const value of [5, 4, 7, 2, 1, 9, 8, 0, 3, 6]) {
    await immediate(); // eslint-disable-line no-await-in-loop
    triggers[value]!.resolve(`${value}`);
    expected.push([value, `${value}`]);
  }

  await iteration;
  t.deepEqual(yielded, expected);
});
