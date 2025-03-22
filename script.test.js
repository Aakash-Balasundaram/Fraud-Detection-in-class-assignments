// script.test.js
// Mock Chart.js since we're not testing chart rendering
jest.mock('chart.js', () => ({
    Chart: jest.fn(() => ({
      destroy: jest.fn(),
    })),
  }));
  
  // Import the script (you'll need to export functions from script.js)
  const {
    formatAssignmentName,
    getTotalSubmissions,
    updateDashboard,
    renderAssignments,
  } = require('./script.js');
  
  // Mock DOM elements and data
  document.body.innerHTML = `
    <div id="total-assignments"></div>
    <div id="high-ai-count"></div>
    <div id="high-plagiarism-count"></div>
    <div id="assignments-container"></div>
    <canvas id="aiChart"></canvas>
    <canvas id="plagiarismChart"></canvas>
    <canvas id="trendsChart"></canvas>
  `;
  
  describe('Academic Integrity Monitor Tests', () => {
    let assignments, assignmentData;
  
    beforeEach(() => {
      // Reset mock data before each test
      assignments = [];
      assignmentData = {};
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ assignments: {} }),
        })
      );
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    // Test formatAssignmentName
    describe('formatAssignmentName', () => {
      test('replaces underscores with spaces', () => {
        expect(formatAssignmentName('Assignment_1')).toBe('Assignment 1');
      });
  
      test('returns name with spaces unchanged', () => {
        expect(formatAssignmentName('Assignment 1')).toBe('Assignment 1');
      });
    });
  
    // Test getTotalSubmissions
    describe('getTotalSubmissions', () => {
      test('calculates total submissions correctly', () => {
        assignmentData = {
          Assignment_1: [{ id: 'S001' }, { id: 'S002' }],
          Assignment_2: [{ id: 'S003' }],
        };
        expect(getTotalSubmissions()).toBe(3);
      });
  
      test('returns 0 for empty assignmentData', () => {
        assignmentData = {};
        expect(getTotalSubmissions()).toBe(0);
      });
    });
  
    // Test updateDashboard
    describe('updateDashboard', () => {
      test('updates stats with correct counts', () => {
        assignments = ['Assignment_1', 'Assignment_2'];
        assignmentData = {
          Assignment_1: [
            { ai_percentage: 60, plagiarism_percentage: 40 },
            { ai_percentage: 20, plagiarism_percentage: 10 },
          ],
          Assignment_2: [{ ai_percentage: 80, plagiarism_percentage: 50 }],
        };
        global.aiThreshold = 50;
        global.plagiarismThreshold = 30;
  
        updateDashboard();
  
        expect(document.getElementById('total-assignments').textContent).toBe('2');
        expect(document.getElementById('high-ai-count').textContent).toBe('2');
        expect(document.getElementById('high-plagiarism-count').textContent).toBe('2');
      });
    });
  
    // Test renderAssignments
    describe('renderAssignments', () => {
      test('renders no assignments message when empty', () => {
        assignments = [];
        renderAssignments();
        const container = document.getElementById('assignments-container');
        expect(container.innerHTML).toContain('No assignments found');
      });
  
      test('renders assignment card correctly', () => {
        assignments = ['Assignment_1'];
        assignmentData = {
          Assignment_1: [
            {
              id: 'S001',
              file_name: 'submission_1.pdf',
              ai_percentage: 60,
              plagiarism_percentage: 40,
            },
          ],
        };
        global.aiThreshold = 50;
        global.plagiarismThreshold = 30;
  
        renderAssignments();
        const container = document.getElementById('assignments-container');
        expect(container.querySelector('.assignment-card')).not.toBeNull();
        expect(container.innerHTML).toContain('Assignment 1');
        expect(container.innerHTML).toContain('submission_1.pdf');
        expect(container.innerHTML).toContain('60.0%');
        expect(container.innerHTML).toContain('40.0%');
      });
    });
  
    // Mock fetchAssignments (since it involves fetch)
    describe('fetchAssignments', () => {
      test('handles API error gracefully', async () => {
        global.fetch.mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
          })
        );
        await fetchAssignments();
        const container = document.getElementById('assignments-container');
        expect(container.innerHTML).toContain('Error loading data');
      });
    });
  });