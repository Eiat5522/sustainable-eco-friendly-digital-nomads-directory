import { performance } from 'perf_hooks';

async function performSequential(items: number) {
  const start = performance.now();
  for(let i=0; i<items; i++) {
    await new Promise(r => setTimeout(r, 10));
  }
  return performance.now() - start;
}

async function performParallel(items: number) {
  const start = performance.now();
  await Promise.allSettled(Array.from({length: items}).map(() => new Promise(r => setTimeout(r, 10))));
  return performance.now() - start;
}

async function run() {
  const seq = await performSequential(50);
  const par = await performParallel(50);
  console.log(`Sequential: ${seq.toFixed(2)}ms`);
  console.log(`Parallel: ${par.toFixed(2)}ms`);
}
run();
