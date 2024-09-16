// Import functions to be tested before the test cases
import { throttle, fetchItem, fetchPosts, renderPost, renderComment, loadComments, showNotification, handleNavClick, checkForUpdates } from '../src/clonernews.js';

// Test 1: Throttle Function Test
function throttleTest() {
  let callCount = 0;

  const testFunc = () => callCount++;
  const throttledFunc = throttle(testFunc, 1000);

  // Call it twice quickly
  throttledFunc();
  throttledFunc();

  setTimeout(() => {
    if (callCount === 1) {
      console.log('Throttle test passed.');
    } else {
      console.error('Throttle test failed.');
    }
  }, 1500);
}

// Test 2: fetchItem Function Test
async function fetchItemTest() {
  const postId = 8863; // Example Hacker News post ID
  const post = await fetchItem(postId);

  if (post && post.id === postId) {
    console.log('fetchItem test passed.');
  } else {
    console.error('fetchItem test failed.');
  }
}

// Test 3: fetchPosts Function Test
async function fetchPostsTest() {
  const posts = await fetchPosts('topstories', 0, 10);

  if (posts.length === 10 && posts[0].id) {
    console.log('fetchPosts test passed.');
  } else {
    console.error('fetchPosts test failed.');
  }
}

// Test 4: renderPost Function Test
function renderPostTest() {
  const post = {
    id: 123,
    title: "Test Post",
    by: "test_user",
    time: Date.now() / 1000,
    score: 100,
    url: "https://example.com"
  };

  const postElement = renderPost(post);

  if (postElement && postElement.querySelector('h2 a').textContent === "Test Post") {
    console.log('renderPost test passed.');
  } else {
    console.error('renderPost test failed.');
  }
}

// Test 5: renderComment Function Test
function renderCommentTest() {
  const comment = {
    by: "test_user",
    text: "This is a test comment.",
    kids: []
  };

  const commentHTML = renderComment(comment);
  if (commentHTML.includes('test_user') && commentHTML.includes('This is a test comment.')) {
    console.log('renderComment test passed.');
  } else {
    console.error('renderComment test failed.');
  }
}

// Test 6: loadComments Function Test
async function loadCommentsTest() {
  const commentContainer = document.createElement('div');
  await loadComments(8863, commentContainer);

  if (commentContainer.innerHTML.includes('comment')) {
    console.log('loadComments test passed.');
  } else {
    console.error('loadComments test failed.');
  }
}

// Test 7: showNotification Function Test
function showNotificationTest() {
  const notification = document.createElement('div');
  notification.id = 'notification';
  document.body.appendChild(notification);

  showNotification('Test notification');

  setTimeout(() => {
    if (notification.textContent === 'Test notification') {
      console.log('showNotification test passed.');
    } else {
      console.error('showNotification test failed.');
    }
  }, 1000);
}

// Test 8: handleNavClick Function Test
function handleNavClickTest() {
  const mockEvent = {
    preventDefault: () => {},
    target: { id: 'nav-ask' }
  };

  handleNavClick(mockEvent);

  if (currentPostType === 'askstories') {
    console.log('handleNavClick test passed.');
  } else {
    console.error('handleNavClick test failed.');
  }
}

// Test 9: checkForUpdates Function Test
async function checkForUpdatesTest() {
  const updatesList = document.createElement('ul');
  updatesList.id = 'live-updates-list';
  document.body.appendChild(updatesList);

  await checkForUpdates();

  if (updatesList.children.length > 0) {
    console.log('checkForUpdates test passed.');
  } else {
    console.error('checkForUpdates test failed.');
  }
}

// Run all tests
document.addEventListener('DOMContentLoaded', () => {
  throttleTest();
  fetchItemTest();
  fetchPostsTest();
  renderPostTest();
  renderCommentTest();
  loadCommentsTest();
  showNotificationTest();
  handleNavClickTest();
  checkForUpdatesTest();
});
