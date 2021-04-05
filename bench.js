import { suite, add, cycle, complete } from 'benny';
import { pIter, pIterEnumerated, pIterSettled } from 'p-iter';
import frstcmfrstsvd from 'frstcmfrstsvd';

function* range(start, stop) {
  while (start < stop) {
    yield start++;
  }
}

const oneHundredResolved = [...range(0, 100)].map((n) => Promise.resolve(n));
const oneThousandResolved = [...range(0, 1000)].map((n) => Promise.resolve(n));
const consumers = [pIter, pIterEnumerated, pIterSettled, frstcmfrstsvd];

(async () => {
  // Unfortunately, eslint doesn't support top-level await yet

  function consumeAll(consumer, source) {
    return add(consumer.name, async () => {
      // eslint-disable-next-line no-unused-vars, no-empty
      for await (const value of consumer(source)) {
      }
    });
  }

  await suite(
    'process an array of 100 resolved promises',
    ...consumers.map((consumer) => consumeAll(consumer, oneHundredResolved)),
    add('Promise.all', async () => {
      await Promise.all(oneHundredResolved);
    }),
    add('Promise.allSettled', async () => {
      await Promise.allSettled(oneHundredResolved);
    }),
    cycle(),
    complete()
  );

  function consumeN(consumer, source, count) {
    return add(consumer.name, async () => {
      // eslint-disable-next-line no-unused-vars
      for await (const value of consumer(oneHundredResolved)) {
        if (count-- === 0) {
          break;
        }
      }
    });
  }

  await suite(
    'process one value from an array of 100 resolved promises',
    ...consumers.map((consumer) => consumeN(consumer, oneHundredResolved, 1)),
    add('Promise.race()', async () => {
      await Promise.race(oneHundredResolved);
    }),
    cycle(),
    complete()
  );

  await suite(
    'process an array of 1000 resolved promises',
    ...consumers.map((consumer) => consumeAll(consumer, oneThousandResolved)),
    add('Promise.all', async () => {
      await Promise.all(oneThousandResolved);
    }),
    add('Promise.allSettled', async () => {
      await Promise.allSettled(oneThousandResolved);
    }),
    cycle(),
    complete()
  );

  const lastResolved = [
    ...[...range(0, 99)].map(() => new Promise(() => {})),
    Promise.resolve(99),
  ];

  await suite(
    'process one value from an array of 99 pending and 1 resolved promises',
    ...consumers.map((consumer) => consumeN(consumer, lastResolved, 1)),
    add('Promise.race()', async () => {
      await Promise.race(lastResolved);
    }),
    cycle(),
    complete()
  );

  function* generateResolved(count) {
    let index = 0;
    while (index < count) {
      yield Promise.resolve(index++);
    }
  }

  function addAwait(name, awaiter, source) {
    return add(name, async () => {
      await awaiter(source);
    });
  }

  await suite(
    'process a generator of 100 resolved promises',
    ...[pIter, pIterSettled, pIterEnumerated].map((consumer) =>
      consumeAll(consumer, generateResolved(100))
    ),
    addAwait('Promise.all()', Promise.all.bind(Promise), generateResolved(100)),
    addAwait(
      'Promise.allSettled()',
      Promise.allSettled.bind(Promise),
      generateResolved(100)
    ),
    cycle(),
    complete()
  );
})();
