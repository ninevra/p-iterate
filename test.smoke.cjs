const test = require('ava');
const { pIter } = require('p-iter');

test('module structure', (t) => {
  t.snapshot(require('p-iter'));
});

test('pIter() runs', async (t) => {
  const results = [];
  for await (const result of pIter([Promise.resolve(1), Promise.resolve(2)])) {
    results.push(result);
  }

  t.deepEqual(results.sort(), [1, 2]);
});
