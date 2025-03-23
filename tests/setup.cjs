// tests/setup.cjs
const fetchMock = require('fetch-mock');
global.fetch = fetchMock.sandbox();

global.Chart = jest.fn().mockImplementation(() => ({
  destroy: jest.fn(),
  render: jest.fn(),
}));