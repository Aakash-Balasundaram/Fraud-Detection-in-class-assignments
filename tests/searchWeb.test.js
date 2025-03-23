// tests/searchWeb.test.js
import { searchWeb, calculateSimilarity } from '../script.js';

describe('searchWeb', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    fetch.resetMocks();
  });

  test('successfully fetches and processes search results', async () => {
    // Mock API response
    const mockResponse = {
      searchInformation: {
        totalResults: '2'
      },
      items: [
        {
          title: 'Test Result 1',
          link: 'https://example.com/1',
          snippet: 'This is a test result with some similarity to the query.',
          formattedUrl: 'example.com/1'
        },
        {
          title: 'Test Result 2',
          link: 'https://example.com/2',
          snippet: 'Another test result with less similarity.',
          formattedUrl: 'example.com/2'
        }
      ]
    };

    // Mock the fetch response
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    // Create mock output and configuration objects
    const output = {
      setLoading: jest.fn(),
      updateResults: jest.fn()
    };

    const config = {
      searchEngine_API: 'test-api-key',
      searchEngine_Id: 'test-search-engine-id'
    };

    // Call the function
    const searchText = 'This is a test query with some similarity';
    const results = await searchWeb(searchText, output, config);

    // Assert fetch was called with correct URL
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://www.googleapis.com/customsearch/v1')
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`key=${config.searchEngine_API}`)
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`cx=${config.searchEngine_Id}`)
    );

    // Check that loading state was handled
    expect(output.setLoading).toHaveBeenCalledTimes(2);
    expect(output.setLoading).toHaveBeenNthCalledWith(1, true);
    expect(output.setLoading).toHaveBeenNthCalledWith(2, false);

    // Check that results were processed correctly
    expect(results.sources.length).toBe(2);
    expect(results.totalResults).toBe(2);
    expect(output.updateResults).toHaveBeenCalledWith(results);

    // Check that results are sorted by similarity score
    expect(results.sources[0].similarityScore).toBeGreaterThanOrEqual(results.sources[1].similarityScore);
  });

  test('handles API error gracefully', async () => {
    // Mock API error
    fetch.mockReject(new Error('Network error'));

    // Create mock output and configuration objects
    const output = {
      setLoading: jest.fn(),
      setError: jest.fn()
    };

    const config = {
      searchEngine_API: 'test-api-key',
      searchEngine_Id: 'test-search-engine-id'
    };

    // Call the function and expect it to throw
    await expect(searchWeb('test query', output, config)).rejects.toThrow();

    // Check that loading state was handled
    expect(output.setLoading).toHaveBeenCalledTimes(2);
    expect(output.setLoading).toHaveBeenNthCalledWith(1, true);
    expect(output.setLoading).toHaveBeenNthCalledWith(2, false);

    // Check that error was handled
    expect(output.setError).toHaveBeenCalledWith('Network error');
  });

  test('throws error if API configuration is missing', async () => {
    // Call with invalid config
    await expect(searchWeb('test query', {}, {})).rejects.toThrow('Missing API configuration');
  });

  test('throws error if input text is invalid', async () => {
    const config = {
      searchEngine_API: 'test-api-key',
      searchEngine_Id: 'test-search-engine-id'
    };

    // Call with invalid text
    await expect(searchWeb('', {}, config)).rejects.toThrow('Invalid input');
    await expect(searchWeb(null, {}, config)).rejects.toThrow('Invalid input');
  });
});

describe('calculateSimilarity', () => {
  test('calculates similarity between two similar texts', () => {
    const text1 = 'The quick brown fox jumps over the lazy dog';
    const text2 = 'A quick brown fox jumped over a lazy dog';
    
    const similarity = calculateSimilarity(text1, text2);
    
    // Should have high similarity but not 1.0
    expect(similarity).toBeGreaterThan(0.5);
    expect(similarity).toBeLessThan(1.0);
  });
  
  test('calculates similarity between two different texts', () => {
    const text1 = 'The quick brown fox jumps over the lazy dog';
    const text2 = 'Completely different text with no matching words';
    
    const similarity = calculateSimilarity(text1, text2);
    
    // Should have low similarity
    expect(similarity).toBeLessThan(0.2);
  });
  
  test('handles empty or null inputs', () => {
    expect(calculateSimilarity('', 'test')).toBe(0);
    expect(calculateSimilarity('test', '')).toBe(0);
    expect(calculateSimilarity(null, 'test')).toBe(0);
    expect(calculateSimilarity('test', null)).toBe(0);
    expect(calculateSimilarity('', '')).toBe(0);
  });
  
  test('identical texts have similarity of 1', () => {
    const text = 'The quick brown fox';
    expect(calculateSimilarity(text, text)).toBe(1);
  });
});