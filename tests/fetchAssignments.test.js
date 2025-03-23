// tests/fetchAssignments.test.js
import { fetchAssignments } from '../script.js';

describe('fetchAssignments', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="assignments-container"></div><div id="loading"></div>';
    fetch.reset(); // Reset fetch mock before each test
  });

  test('fetches and processes assignments successfully', async () => {
    fetch.mockResponseOnce(JSON.stringify({
      assignments: {
        Assignment_1: [{ id: 'S001', file_name: 'submission_1.pdf', ai_percentage: 60, plagiarism_percentage: 20 }],
      },
    }));

    await fetchAssignments();
    expect(fetch).toHaveBeenCalledWith('/api/assignments');
    expect(window.assignments.length).toBe(1);
    expect(window.assignmentData['Assignment_1'].length).toBe(1);
  });

  test('handles fetch error', async () => {
    fetch.mockReject(new Error('Network error'));
    await fetchAssignments();
    const container = document.getElementById('assignments-container');
    expect(container.textContent).toContain('Error loading data');
  });
});