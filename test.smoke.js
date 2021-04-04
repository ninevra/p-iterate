import test from 'ava';

test('module structure', async (t) => {
  t.snapshot(await import('p-iter'));
});
