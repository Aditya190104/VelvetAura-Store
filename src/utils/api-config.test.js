import test from 'node:test';
import assert from 'node:assert/strict';
import { isLocalHost, resolveApiBase } from './api-config.js';

test('a production build on localhost still connects to the local API proxy', () => {
  for (const hostname of ['localhost', '127.0.0.1', '[::1]']) {
    assert.equal(resolveApiBase({ hostname, development: false }), '/api');
  }
});

test('development uses the API proxy and an explicit API URL takes priority', () => {
  assert.equal(resolveApiBase({ development: true, hostname: 'terminal.local' }), '/api');
  assert.equal(resolveApiBase({ url: ' https://api.example.com/api/ ', hostname: 'localhost' }), 'https://api.example.com/api');
  assert.equal(resolveApiBase({ url: ' /api/ ', hostname: 'shop.example.com' }), '/api');
});

test('hosted builds stay unavailable until a real API is configured', () => {
  assert.equal(resolveApiBase({ hostname: 'shop.example.com' }), '');
  assert.equal(resolveApiBase({ url: '  ', hostname: 'shop.example.com' }), '');
  assert.equal(isLocalHost('localhost.evil.example'), false);
  assert.equal(isLocalHost('192.168.1.20'), false);
});
