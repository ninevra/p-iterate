import { suite, add, cycle, complete } from 'benny';
import { pIter, pIterEnumerated, pIterSettled } from 'p-iter';
import frstcmfrstsvd from 'frstcmfrstsvd';

function* range(start, stop) {
  while (start < stop) {
    yield start++;
  }
}

const oneHundredResolved = [...range(0, 100)].map((n) => Promise.resolve(n));

suite(
  'process an array of 100 resolved promises',
  add('pIter', async () => {
    // eslint-disable-next-line no-unused-vars, no-empty
    for await (const value of pIter(oneHundredResolved)) {
    }
  }),
  add('pIterEnumerated', async () => {
    // eslint-disable-next-line no-unused-vars, no-empty
    for await (const value of pIterEnumerated(oneHundredResolved)) {
    }
  }),
  add('pIterSettled', async () => {
    // eslint-disable-next-line no-unused-vars, no-empty
    for await (const value of pIterSettled(oneHundredResolved)) {
    }
  }),
  add('frstcmfrstsvd', async () => {
    // eslint-disable-next-line no-unused-vars, no-empty
    for await (const result of frstcmfrstsvd(oneHundredResolved)) {
    }
  }),
  add('Promise.all', async () => {
    await Promise.all(oneHundredResolved);
  }),
  add('Promise.allSettled', async () => {
    await Promise.allSettled(oneHundredResolved);
  }),
  cycle(),
  complete()
);
