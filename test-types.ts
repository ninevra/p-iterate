import { pIter } from './index.js';
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

// Yields an async generator over the awaited types of the input
expectTypeOf(pIter(promiseGenerator())).toEqualTypeOf<
  AsyncGenerator<number | string, void, unknown>
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
).toEqualTypeOf<AsyncGenerator<number | string, void, unknown>>();
expectTypeOf(pIter([Promise.resolve(42), 42])).toEqualTypeOf<
  AsyncGenerator<number, void, unknown>
>();
expectTypeOf(pIter([Promise.resolve(42), 'foo'])).toEqualTypeOf<
  AsyncGenerator<number | string, void, unknown>
>();
expectTypeOf(pIter([Promise.resolve(42), Promise.resolve(42)])).toEqualTypeOf<
  AsyncGenerator<number, void, unknown>
>();
