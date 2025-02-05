const API_BASE_URL = 'https://hacker-news.firebaseio.com/v0/';
let currentPostType = 'newstories';
let loadedPosts = 0;
const POSTS_PER_PAGE = 7;
let lastUpdateTime = Date.now();
let loadedPostIds = new Set();

const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

const fetchItem = async (id) => {
  const response = await fetch(`${API_BASE_URL}item/${id}.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch item ${id}: ${response.statusText}`);
  }
  return response.json();
}

function extractObjectIDs(data) {
  return data.hits.map(item => item.objectID);
}

const fetchPosts = async (postType, start, end) => {
  if (postType === 'polls') {
    const response = await fetch('https://hn.algolia.com/api/v1/search_by_date?tags=poll');

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const pollsIds = extractObjectIDs(data);
    const newPolls = await Promise.all(pollsIds.slice(start, end).map(fetchItem));
    return newPolls;
  }
  const response = await fetch(`${API_BASE_URL}${postType}.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch posts of type ${postType}: ${response.statusText}`);
  }
  const postIds = await response.json();
  const postIdsSubset = postIds.slice(start, end);
  return Promise.all(postIdsSubset.map(fetchItem));
}

const renderPost = (post) => {
  const postElement = document.createElement('div');
  postElement.className = 'post';
  postElement.innerHTML = `
    <h2><a href="${post.url || `https://news.ycombinator.com/item?id=${post.id}`}" target="_blank">${post.title}</a></h2>
    <p class="post-meta">By ${post.by} | ${new Date(post.time * 1000)} | ${post.score} points</p>
    ${post.text ? `<p>${post.text}</p>` : ''}
    ${renderPostSpecificContent(post)}
    <a href="#" class="toggle-comments" data-id="${post.id}">Show Comments (${post.descendants || 0})</a>
    <div class="comments" id="comments-${post.id}"></div>
  `;
  return postElement;
}

const renderPostSpecificContent = (post) => {
  if (post.type === 'job') {
    return `<p><strong>Job Posting:</strong> ${post.text || 'No description available.'}</p>`;
  } else if (post.type === 'poll') {
    return renderPollContent(post);
  }
  return '';
}

const renderPollContent = (poll) => {
  if (!poll.parts || poll.parts.length === 0) return '';
  
  let pollContent = '<div class="poll-options">';
  poll.parts.forEach(optionId => {
    pollContent += `<div class="poll-option" id="poll-option-${optionId}">Loading option...</div>`;
  });
  pollContent += '</div>';
  
  // Load poll options asynchronously
  poll.parts.forEach(async (optionId) => {
    const option = await fetchItem(optionId);
    const optionElement = document.getElementById(`poll-option-${optionId}`);
    if (optionElement) {
      optionElement.innerHTML = `
        <p>${option.text}</p>
        <p class="poll-option-score">${option.score} votes</p>
      `;
    }
  });
  
  return pollContent;
}

const renderComment = (comment, depth = 0) => {
  if (comment.deleted || comment.dead) return '';
  const avatar = comment.by.charAt(0).toUpperCase();
  return `
    <div class="comment" style="margin-left: ${depth * 20}px;">
      <div class="comment-avatar">${avatar}</div>
      <div class="comment-content">
        <p class="post-meta">${comment.by}</p>
        <p>${comment.text}</p>
        <div class="comment-actions">
          ${comment.kids ? `<a href="#" class="toggle-replies" data-id="${comment.id}">Show Replies (${comment.kids.length})</a>` : ''}
        </div>
      </div>
      ${comment.kids ? `<div class="nested-comments" id="replies-${comment.id}"></div>` : ''}
    </div>
  `;
}

const loadComments = async (postId, commentContainer, depth = 0) => {
  const post = await fetchItem(postId);
  if (post.kids) {
    const comments = await Promise.all(post.kids.map(fetchItem));
    commentContainer.innerHTML = comments.map(comment => renderComment(comment, depth)).join('');
    commentContainer.addEventListener('click', handleCommentActions);
  }
}

const handleCommentActions = async (event) => {
  event.preventDefault();
  if (event.target.classList.contains('toggle-replies')) {
    const replyId = event.target.getAttribute('data-id');
    const replyContainer = document.getElementById(`replies-${replyId}`);
    const reply = await fetchItem(replyId);
    if (replyContainer.innerHTML === '') {      
      if (reply.kids) {
        await loadComments(replyId, replyContainer, 1);
      }
      event.target.textContent = 'Hide Replies';
    } else {
      replyContainer.innerHTML = '';
      event.target.textContent = `Show Replies (${reply.kids.length})`;
    }
  }
}

const loadPosts = async () => {
  const posts = await fetchPosts(currentPostType, loadedPosts, loadedPosts + POSTS_PER_PAGE);
  
  posts.forEach(post => {
    if (!loadedPostIds.has(post.id)) {
      loadedPostIds.add(post.id);
      document.getElementById('main-content').appendChild(renderPost(post));
    }
  });
  
  loadedPosts += POSTS_PER_PAGE;
}

const handleNavClick = (event) => {
  event.preventDefault();
  
  // Remove the 'active' class from all navigation items
  document.querySelectorAll('nav a').forEach(navItem => {
    navItem.classList.remove('active');
  });
  
  // Add the 'active' class to the clicked navigation item
  const clickedNav = event.target;
  clickedNav.classList.add('active');
  
  // Update the current post type based on the clicked navigation item
  const clickedNavId = clickedNav.id.split('-')[1];
  switch (clickedNavId) {
    case 'jobs':
      currentPostType = 'jobstories';
      break;
    case 'polls':
      currentPostType = 'polls';
      break;
    case 'ask':
      currentPostType = 'askstories';
      break;
    case 'show':
      currentPostType = 'showstories';
      break;
    default:
      currentPostType = 'topstories';
  }
  
  document.getElementById('main-content').innerHTML = '';
  loadedPosts = 0;
  loadedPostIds.clear();
  loadPosts();
}

const showNotification = (message) => {
  const notification = document.getElementById('notification');
  notification.innerHTML = message;
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

const checkForUpdates = async () => {
  const response = await fetch(`${API_BASE_URL}updates.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch updates: ${response.statusText}`);
  }
  const updates = await response.json();

  if (updates.items.length > 0 || updates.profiles.length > 0) {
    const updateTime = Date.now();
    if (updateTime - lastUpdateTime >= 5000) {
      showNotification(`New update available! from ${updates.profiles[0]}`);
      lastUpdateTime = updateTime;
    }
    
    const updatesList = document.getElementById('live-updates-list');
    // updatesList.innerHTML = '';
    
    const newPosts = [];
    for (const itemId of updates.items) {
      const item = await fetchItem(itemId);
      if (!loadedPostIds.has(item.id)) {
        newPosts.push(item);
      }
    }
    
    newPosts.slice(0, 5).forEach(post => {
      // const li = document.createElement('li');
      // li.textContent = `${post.type}: ${post.title || post.text}`;
      console.log(post)
      let cont = `<li><p><h5>${post.type} by: ${post.by} </h5>${post.title || post.text}</p></li>`
      updatesList.innerHTML = cont + updatesList.innerHTML;
      loadedPostIds.add(post.id);
    });
  }
}

const fetchSidebarPosts = async (postType, listId) => {
  try {
    const response = await fetch(`${API_BASE_URL}${postType}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sidebar posts of type ${postType}: ${response.statusText}`);
    }
    const postIds = await response.json();
    const postIdsSubset = postIds.slice(0, 10); // Limit to 10 posts for the sidebar
    const posts = await Promise.all(postIdsSubset.map(fetchItem));
    
    const list = document.getElementById(listId);
    list.innerHTML = posts.map(post => `
      <li><a href="${post.url || `https://news.ycombinator.com/item?id=${post.id}`}" target="_blank">${post.title}</a></li>
    `).join('');
  } catch (error) {
    console.error('Error fetching sidebar posts:', error);
  }
}

const handleScroll = () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) { // Trigger when near the bottom
    loadPosts();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadPosts();
  document.querySelectorAll('nav a').forEach(navItem => {
    navItem.addEventListener('click', handleNavClick);
  });
  
  document.getElementById('main-content').addEventListener('click', async (event) => {
    if (event.target.classList.contains('toggle-comments')) {
      event.preventDefault();
      const postId = event.target.getAttribute('data-id');
      const commentContainer = document.getElementById(`comments-${postId}`);
      if (commentContainer.innerHTML === '') {
        await loadComments(postId, commentContainer);
        event.target.textContent = 'Hide Comments';
      } else {
        commentContainer.innerHTML = '';
        event.target.textContent = `Show Comments`;
      }
    }
  });

  // Initialize sidebar with top, new, and best stories
  fetchSidebarPosts('topstories', 'top-stories-list');
  fetchSidebarPosts('newstories', 'new-stories-list');
  fetchSidebarPosts('beststories', 'best-stories-list');
  
  // Load existing post IDs
  const initialPosts = await fetchPosts(currentPostType, 0, POSTS_PER_PAGE);
  initialPosts.forEach(post => loadedPostIds.add(post.id));

  // Set up scroll event listener for lazy loading
  window.addEventListener('scroll', throttle(handleScroll, 200));

  // Set up interval for checking updates
  setInterval(throttle(checkForUpdates, 5000), 5000);
});

module.exports = {
  throttle,
  fetchItem,
  fetchPosts,
  renderPost,
  renderPollContent,
  loadComments,
  showNotification,
  handleNavClick,
  checkForUpdates,
  fetchSidebarPosts
};