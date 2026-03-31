import test, { mock } from 'node:test';
import assert from 'node:assert';
import axios from 'axios';

process.env.VITE_SUPABASE_URL = 'http://test.url';
process.env.VITE_SUPABASE_ANON_KEY = 'test_key';

const { default: handler } = await import('./scrape.ts');

test('Scrape API - throws BASE64_DOM_DUMP when attendance is empty', async () => {
  const originalAxiosCreate = axios.create;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mock.method(axios, 'create', (config: any) => {
    const client = originalAxiosCreate(config);

    mock.method(client, 'post', async () => {
       return { data: { status: 'success', data: { access_token: '123', oauthorize_uri: 'http://test' } } };
    });

    mock.method(client, 'get', async (url: string) => {
      if (url.includes('My_Attendance')) {
         // Return html that has course data headers, but no rows that match the parser correctly, thus leaving attendance array empty
         // Ensure we trigger the BASE64_DOM_DUMP error
         return { data: '<html><body>Name: <strong>Student Name</strong> Batch: <strong>Batch 1</strong> <table class="sanitize(\'22\')"><tr><td>Course Code</td><td>Course Title</td></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></table></body></html>' };
      }
      if (url.includes('Academic_Planner')) {
         return { data: '' };
      }
      return { data: '' };
    });

    return client;
  });

  // Mock console.error to intercept the logged message and assert on it
  let loggedError = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mock.method(console, 'error', (msg: any) => {
      try {
          const parsed = JSON.parse(msg);
          if (parsed.message === 'Vercel Scraping Root Error') {
              loggedError = parsed.error;
          }
      } catch {
        // ignore
      }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const req: any = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: { regNo: 'test', password: 'password' }
  };

  let statusCode = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let responseData: any = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res: any = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    json: (data: any) => {
      responseData = data;
      return res;
    }
  };

  await handler(req, res);

  // Restore console.error before asserts so test runner output works
  mock.restoreAll();

  assert.strictEqual(statusCode, 500);
  assert.strictEqual(responseData.error, 'Fatal scraping termination. Please try again later.');

  assert.ok(loggedError, 'Expected an error to be logged');
  assert.ok(
    (loggedError as string).includes('BASE64_DOM_DUMP:'),
    `Expected error to include BASE64_DOM_DUMP:, but got: ${loggedError}`
  );
});
