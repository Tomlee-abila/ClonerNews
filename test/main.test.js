// Import the functions from the main script
const {
  fetchItem,
  fetchPosts,
  renderPost,
  throttle,
  handleScroll,
  loadPosts,
  loadComments
} = require('./scripts.js'); // Adjust the path as needed

const fetchMock = require('fetch-mock');

// Jest test cases
describe("Hacker News Script Tests", () => {
  const API_BASE_URL = 'https://hacker-news.firebaseio.com/v0/';

  afterEach(() => {
    fetchMock.restore();  // Reset all fetch mocks after each test
  });

  // Test fetchItem functions
  describe("fetchItem", () => {
    it("should fetch an item by id successfully", async () => {
      const mockItem = { id: 1, title: "Test Post" };
      fetchMock.get(`${API_BASE_URL}item/1.json`, mockItem);

      const item = await fetchItem(1);

      expect(item).toEqual(mockItem);
      expect(fetchMock.called(`${API_BASE_URL}item/1.json`)).toBe(true);
    });

    it("should throw an error if fetching an item fails", async () => {
      fetchMock.get(`${API_BASE_URL}item/1.json`, 500);

      await expect(fetchItem(1)).rejects.toThrow("Failed to fetch item 1");
    });
  });

  // Test fetchPosts function
  describe("fetchPosts", () => {
    it("should fetch posts by type and return a subset of items", async () => {
      const mockPostIds = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const mockItem = { id: 1, title: "Test Post" };

      fetchMock.get(`${API_BASE_URL}newstories.json`, mockPostIds);
      fetchMock.get(`${API_BASE_URL}item/1.json`, mockItem);

      const posts = await fetchPosts('newstories', 0, 1);

      expect(posts).toEqual([mockItem]);
      expect(fetchMock.called(`${API_BASE_URL}newstories.json`)).toBe(true);
    });

    it("should throw an error if fetching post type fails", async () => {
      fetchMock.get(`${API_BASE_URL}newstories.json`, 500);

      await expect(fetchPosts('newstories', 0, 1)).rejects.toThrow(
        "Failed to fetch posts of type newstories"
      );
    });
  });

  // Test renderPost function
  describe("renderPost", () => {
    it("should correctly generate HTML for a post", () => {
      const mockPost = {
        id: 1,
        title: "Test Post",
        by: "author",
        time: Date.now() / 1000,
        score: 100,
        descendants: 0,
        url: "https://example.com"
      };

      const postElement = renderPost(mockPost);
      expect(postElement.querySelector("h2").textContent).toContain("Test Post");
      expect(postElement.querySelector("a").href).toBe("https://example.com/");
    });
  });

  // Test throttle function
  describe("throttle", () => {
    jest.useFakeTimers(); // Use Jest's fake timer functions

    it("should throttle function calls", () => {
      const mockFunc = jest.fn();
      const throttledFunc = throttle(mockFunc, 200);

      throttledFunc();
      throttledFunc();
      throttledFunc();

      expect(mockFunc).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(200);
      throttledFunc();
      expect(mockFunc).toHaveBeenCalledTimes(2);
    });
  });

  // Test scroll handling
  describe("Scroll Handling", () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="main-content"></div>';
      window.innerHeight = 1000;
      document.body.style.height = '1500px'; // simulate a scrollable body
    });

    it("should load more posts when scrolled near the bottom", () => {
      const loadPostsMock = jest.fn();
      window.scrollY = 600;

      window.addEventListener('scroll', throttle(handleScroll, 200));
      window.dispatchEvent(new Event('scroll'));

      expect(loadPostsMock).not.toHaveBeenCalled();
      window.scrollY = 1000;
      window.dispatchEvent(new Event('scroll'));

      expect(loadPostsMock).toHaveBeenCalled();
    });
  });

  // Test Comment Toggling
  describe("Comment Toggling", () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="main-content">
          <a href="#" class="toggle-comments" data-id="1">Show Comments</a>
          <div class="comments" id="comments-1"></div>
        </div>
      `;
    });

    it("should load and show comments when 'Show Comments' is clicked", async () => {
      const mockComments = { id: 1, text: "Test comment" };
      fetchMock.get(`${API_BASE_URL}item/1.json`, mockComments);

      const toggleCommentsLink = document.querySelector('.toggle-comments');
      toggleCommentsLink.click();

      await new Promise(setImmediate); // wait for fetch to resolve

      const commentContainer = document.getElementById('comments-1');
      expect(commentContainer.innerHTML).toContain("Test comment");
      expect(toggleCommentsLink.textContent).toBe("Hide Comments");
    });

    it("should hide comments when 'Hide Comments' is clicked", () => {
      const toggleCommentsLink = document.querySelector('.toggle-comments');
      const commentContainer = document.getElementById('comments-1');

      commentContainer.innerHTML = "Test comment";
      toggleCommentsLink.textContent = "Hide Comments";

      toggleCommentsLink.click();

      expect(commentContainer.innerHTML).toBe('');
      expect(toggleCommentsLink.textContent).toBe("Show Comments");
    });
  });
});
