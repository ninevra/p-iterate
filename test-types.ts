import { pIter, pIterEnumerated, pIterSettled } from './index.js';
import { expectTypeOf } from 'expect-type';

function* promiseGenerator() {
  yield Promise.resolve(42);
  yield Promise.resolve('foo');
  yield 42;
  yield 'foo';
}

async function* awaitedGenerator() {
  yield 42;
  yield 'foo';
}

// Test pIter()

// Yields an async generator over the awaited types of the input
expectTypeOf(pIter(promiseGenerator())).toEqualTypeOf<
  AsyncGenerator<number | string, void>
>();
expectTypeOf(pIter(promiseGenerator())).toMatchTypeOf<
  AsyncGenerator<number | string>
>();
expectTypeOf(pIter(promiseGenerator())).toMatchTypeOf<
  AsyncIterable<number | string>
>();
expectTypeOf(pIter(promiseGenerator())).toMatchTypeOf<
  AsyncIterator<number | string>
>();

// Equals the type of a standard async generator
expectTypeOf(pIter(promiseGenerator())).toEqualTypeOf(awaitedGenerator());

// Handles different combinations of input types
expectTypeOf(
  pIter([Promise.resolve(42), Promise.resolve('foo')])
).toEqualTypeOf<AsyncGenerator<number | string, void>>();
expectTypeOf(pIter([Promise.resolve(42), 42])).toEqualTypeOf<
  AsyncGenerator<number, void>
>();
expectTypeOf(pIter([Promise.resolve(42), 'foo'])).toEqualTypeOf<
  AsyncGenerator<number | string, void>
>();
expectTypeOf(pIter([Promise.resolve(42), Promise.resolve(42)])).toEqualTypeOf<
  AsyncGenerator<number, void>
>();

// Test pIterEnumerated

// Yields an async generator over pairs [number, awaited types of the input]
expectTypeOf(pIterEnumerated(promiseGenerator())).toEqualTypeOf<
  AsyncGenerator<[number, number | string], void>
>();
expectTypeOf(pIterEnumerated(promiseGenerator())).toMatchTypeOf<
  AsyncGenerator<[number, number | string]>
>();
expectTypeOf(pIterEnumerated(promiseGenerator())).toMatchTypeOf<
  AsyncIterable<[number, number | string]>
>();
expectTypeOf(pIterEnumerated(promiseGenerator())).toMatchTypeOf<
  AsyncIterator<[number, number | string]>
>();

// Handles different combinations of input types
expectTypeOf(
  pIterEnumerated([Promise.resolve(42), Promise.resolve('foo')])
).toEqualTypeOf<AsyncGenerator<[number, number | string], void>>();
expectTypeOf(pIterEnumerated([Promise.resolve(42), 42])).toEqualTypeOf<
  AsyncGenerator<[number, number], void>
>();
expectTypeOf(pIterEnumerated([Promise.resolve(42), 'foo'])).toEqualTypeOf<
  AsyncGenerator<[number, number | string], void>
>();
expectTypeOf(
  pIterEnumerated([Promise.resolve(42), Promise.resolve(42)])
).toEqualTypeOf<AsyncGenerator<[number, number], void>>();

// Test pIterSettled

// Yields an async generator over settled results
expectTypeOf(pIterSettled(promiseGenerator())).toEqualTypeOf<
  AsyncGenerator<
    PromiseSettledResult<number | string> & { index: number },
    void
  >
>();
expectTypeOf(pIterSettled(promiseGenerator())).toMatchTypeOf<
  AsyncGenerator<PromiseSettledResult<number | string> & { index: number }>
>();
expectTypeOf(pIterSettled(promiseGenerator())).toMatchTypeOf<
  AsyncIterable<PromiseSettledResult<number | string> & { index: number }>
>();
expectTypeOf(pIterSettled(promiseGenerator())).toMatchTypeOf<
  AsyncIterator<PromiseSettledResult<number | string> & { index: number }>
>();

// Sanity-check the type of PromiseSettledResult
expectTypeOf(pIterSettled(promiseGenerator())).toEqualTypeOf<
  AsyncGenerator<
    | { status: 'fulfilled'; value: number | string; index: number }
    | { status: 'rejected'; reason: any; index: number },
    void
  >
>();

// Handles different combinations of input types
expectTypeOf(
  pIterSettled([Promise.resolve(42), Promise.resolve('foo')])
).toEqualTypeOf<
  AsyncGenerator<
    PromiseSettledResult<number | string> & { index: number },
    void
  >
>();
expectTypeOf(pIterSettled([Promise.resolve(42), 42])).toEqualTypeOf<
  AsyncGenerator<PromiseSettledResult<number> & { index: number }, void>
>();
expectTypeOf(pIterSettled([Promise.resolve(42), 'foo'])).toEqualTypeOf<
  AsyncGenerator<
    PromiseSettledResult<number | string> & { index: number },
    void
  >
>();
expectTypeOf(
  pIterSettled([Promise.resolve(42), Promise.resolve(42)])
).toEqualTypeOf<
  AsyncGenerator<PromiseSettledResult<number> & { index: number }, void>
>();
