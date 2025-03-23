// tests/setup.cjs
const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();

// Mock Chart.js
global.Chart = jest.fn().mockImplementation(() => ({
  destroy: jest.fn(),
  render: jest.fn(),
}));

// Mock HTML elements for tests
document.body.innerHTML = `
<div id="assignments-container"></div>
<div id="loading" style="display: none;"></div>
<canvas id="aiChart"></canvas>
<canvas id="plagiarismChart"></canvas>
<canvas id="trendsChart"></canvas>
`;