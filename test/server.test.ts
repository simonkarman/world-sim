/* eslint-disable @typescript-eslint/no-var-requires */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Server', () => {
  it('runs', async () => {
    // eslint-disable-next-line no-process-env
    process.env.PORT = '12876';
    const server = require('../src/server').default;
    await sleep(500);
    const response = await fetch('http://localhost:12876/health');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('OK');
    await sleep(500);
    await server();
  });
});
