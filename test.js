import test from 'ava';
import { pIter, pIterSettled } from './index.js';

function* range(start, stop) {
  while (start < stop) {
    yield start++;
  }
}

function trigger() {
  let ops;
  const promise = new Promise((resolve, reject) => {
    ops = { resolve, reject };
  });
  return { promise, ...ops };
}

function immediate() {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

test('pIter() yields values in the order they fulfill', async (t) => {
  const triggers = [...range(0, 10)].map(() => trigger());
  const asyncIterable = pIter(triggers.map(({ promise }) => promise));
  const yielded = [];
  const iteration = (async () => {
    for await (const value of asyncIterable) {
      yielded.push(value);
    }
  })();
  const expected = [5, 4, 7, 2, 1, 9, 8, 0, 3, 6];
  for (const value of expected) {
    await immediate(); // eslint-disable-line no-await-in-loop
    triggers[value].resolve(value);
  }

  await iteration;
  t.deepEqual(yielded, expected);
});

test('pIter() rejects with the reason of the first promise to reject', async (t) => {
  const triggers = [trigger(), trigger(), trigger()];
  const asyncIterable = pIter(triggers.map(({ promise }) => promise));
  const yielded = [];
  let rejection;
  const iteration = (async () => {
    try {
      for await (const value of asyncIterable) {
        yielded.push(value);
      }
    } catch (error) {
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

async function consumeAsync(asyncIterable) {
  // eslint-disable-next-line no-unused-vars, no-empty
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
  } catch (error) {
    t.is(error, 2);
  }
});

async function passes(t, work) {
  const attempt = await t.try(work);
  attempt.discard();
  return attempt.passed;
}

test('pIterSettled() iterates over the settled states of the input', async (t) => {
  // eslint-disable-next-line prefer-promise-reject-errors
  const input = [Promise.resolve(1), Promise.reject(2), Promise.resolve(3)];
  const expected = await Promise.allSettled(input);
  const received = [];
  for await (const item of pIterSettled(input)) {
    received.push(item);
    t.true(
      (
        await Promise.all(
          expected.map((expectation) =>
            passes(t, (t) => t.like(item, expectation))
          )
        )
      ).some((v) => v)
    );
  }

  t.is(received.length, input.length);
});
