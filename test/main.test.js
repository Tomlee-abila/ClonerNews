const axios = require('axios');
jest.mock('axios');

// Test throttle function
describe('throttle', () => {
  jest.useFakeTimers();
  
  const mockFunc = jest.fn();
  const throttledFunc = throttle(mockFunc, 1000);
  
  it('should call the function only once within the limit period', () => {
    throttledFunc();
    throttledFunc();
    expect(mockFunc).toHaveBeenCalledTimes(1);
    
    jest.advanceTimersByTime(1000);
    throttledFunc();
    expect(mockFunc).toHaveBeenCalledTimes(2);
  });
});

// Test fetchItem
describe('fetchItem', () => {
  it('should fetch an item by id', async () => {
    const mockItem = { id: 1, title: 'Test Post' };
    axios.get.mockResolvedValue({ data: mockItem });

    const result = await fetchItem(1);
    expect(axios.get).toHaveBeenCalledWith('https://hacker-news.firebaseio.com/v0/item/1.json');
    expect(result).toEqual(mockItem);
  });
});

// Test fetchPosts
describe('fetchPosts', () => {
  it('should fetch a list of posts', async () => {
    const mockPostIds = [1, 2];
    const mockPostItems = [
      { id: 1, title: 'Post 1' },
      { id: 2, title: 'Post 2' }
    ];
    
    axios.get.mockResolvedValueOnce({ data: mockPostIds });
    axios.get.mockResolvedValueOnce({ data: mockPostItems[0] });
    axios.get.mockResolvedValueOnce({ data: mockPostItems[1] });

    const result = await fetchPosts('topstories', 0, 2);
    expect(axios.get).toHaveBeenCalledWith('https://hacker-news.firebaseio.com/v0/topstories.json');
    expect(result).toEqual(mockPostItems);
  });
});

// Test renderPost
describe('renderPost', () => {
  it('should render post HTML correctly', () => {
    const mockPost = { id: 1, title: 'Test Post', by: 'author', time: 1600000000, score: 10 };
    const postElement = renderPost(mockPost);
    
    expect(postElement.querySelector('h2').textContent).toContain('Test Post');
    expect(postElement.querySelector('.post-meta').textContent).toContain('author');
  });
});

// Test renderPollContent
describe('renderPollContent', () => {
  it('should return empty string if no poll parts', () => {
    const result = renderPollContent({ parts: [] });
    expect(result).toBe('');
  });
  
  it('should render poll content if parts are provided', () => {
    const mockPoll = { parts: [1, 2] };
    const result = renderPollContent(mockPoll);
    expect(result).toContain('poll-option-1');
    expect(result).toContain('poll-option-2');
  });
});

// Test loadComments
describe('loadComments', () => {
  it('should load comments for a post', async () => {
    const mockComment = { id: 1, by: 'user', text: 'Test Comment', kids: [] };
    axios.get.mockResolvedValue({ data: mockComment });

    const mockContainer = document.createElement('div');
    await loadComments(1, mockContainer);
    
    expect(mockContainer.innerHTML).toContain('Test Comment');
  });
});

// Test showNotification
describe('showNotification', () => {
  it('should show and hide notification', () => {
    document.body.innerHTML = '<div id="notification"></div>';
    
    showNotification('Test Message');
    const notification = document.getElementById('notification');
    expect(notification.style.display).toBe('block');
    expect(notification.textContent).toBe('Test Message');

    jest.advanceTimersByTime(3000);
    expect(notification.style.display).toBe('none');
  });
});

