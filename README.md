# p-iter

Iterate over promises in the order they fulfill.

## Install

```sh
npm install p-iter
```

## Usage

```javascript
import { pIter } from 'p-iter';

const requests = [fetch('./a.json'), fetch('./b.json'), fetch('./c.json')];

for await (const response of pIter(requests)) {
    console.log(await response.json());
}
```

```javascript
const { pIter } = require('p-iter');

(async () => {
    const requests = [fetch('./a.json'), fetch('./b.json'), fetch('./c.json')];

    for await (const response of pIter(requests)) {
        console.log(await response.json());
    }
})();
```

## API

### pIter\<T\>(promises: Iterable\<PromiseLike\<T\>\>): AsyncGenerator\<T, void, undefined\>

Takes a (finite, sync) iterable of promises and returns an async iterable over the values of the promises, in approximately the order that they fulfill.

Rejects and terminates when any input promise rejects.

The input and output can be composed with standard chaining functions (`Array` or sync iterable chains for the input, and async iterable chains for the output). For convenience, two compositions are provided:

### pIterEnumerated\<T\>(promises: Iterable\<PromiseLike\<T\>\>): AsyncGenerator\<[number, T], void, undefined\>

Like `pIter`, except it yields tuples `[number, T]` containing the index and fulfilled value of the input promise.

### pIterSettled\<T\>(promises: Iterable\<PromiseLike\<T\>\>): AsyncGenerator\<PromiseSettledResult\<T\> & {index: number}, void, undefined\>

Like `pIter`, except it yields objects indicating whether the promise resolved or rejected, its value or reason, and its index in the input iterable:

```typescript
{
    status: 'fulfilled',
    value: T,
    index: number,
}
```

```typescript
{
    status: 'rejected',
    reason: any,
    index: number
}
```

The async iterable returned by `pIterSettled` never itself rejects.

## Prior art

[`frstcmfrstsvd`](https://www.npmjs.com/package/frstcmfrstsvd)
