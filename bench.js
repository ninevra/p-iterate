import Benchmark from 'benchmark';
import { pIter, pIterEnumerated, pIterSettled } from 'p-iter';
import frstcmfrstsvd from 'frstcmfrstsvd';

function* range(start, stop) {
  while (start < stop) {
    yield start++;
  }
}

const oneHundredResolved = [...range(0, 100)].map((n) => Promise.resolve(n));

new Benchmark.Suite('process an array of 100 resolved promises')
  .add('pIter', {
    defer: true,
    fn: async (deferred) => {
      // eslint-disable-next-line no-unused-vars, no-empty
      for await (const value of pIter(oneHundredResolved)) {
      }

      deferred.resolve();
    },
  })
  .add('pIterEnumerated', {
    defer: true,
    fn: async (deferred) => {
      // eslint-disable-next-line no-unused-vars, no-empty
      for await (const value of pIterEnumerated(oneHundredResolved)) {
      }

      deferred.resolve();
    },
  })
  .add('pIterSettled', {
    defer: true,
    fn: async (deferred) => {
      // eslint-disable-next-line no-unused-vars, no-empty
      for await (const value of pIterSettled(oneHundredResolved)) {
      }

      deferred.resolve();
    },
  })
  .add('frstcmfrstsvd', {
    defer: true,
    fn: async (deferred) => {
      // eslint-disable-next-line no-unused-vars, no-empty
      for await (const result of frstcmfrstsvd(oneHundredResolved)) {
      }

      deferred.resolve();
    },
  })
  .add('Promise.all', {
    defer: true,
    fn: async (deferred) => {
      await Promise.all(oneHundredResolved);

      deferred.resolve();
    },
  })
  .add('Promise.allSettled', {
    defer: true,
    fn: async (deferred) => {
      await Promise.allSettled(oneHundredResolved);

      deferred.resolve();
    },
  })
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log(`Fastest is ${this.filter('fastest').map('name')}`);
  })
  .run({
    async: true,
  });
