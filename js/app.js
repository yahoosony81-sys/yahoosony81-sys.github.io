/**
 * Main Application - 게시글 목록 로딩 및 렌더링
 * yahoosony81-sys Blog
 */

(function () {
  'use strict';

  // 전역 변수 (app 전용)
  let allPosts = [];
  let allTags = new Set();

  // DOM 요소
  const postsGrid = document.getElementById('posts-grid');
  const loadingState = document.getElementById('loading-state');
  const emptyState = document.getElementById('empty-state');
  const tagsFilter = document.getElementById('tags-filter');

  /**
   * posts.json 로드
   * @returns {Promise<Array>}
   */
  async function loadPosts() {
    try {
      const response = await fetch('posts.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const posts = await response.json();
      return posts;
    } catch (error) {
      console.error('Failed to load posts:', error);
      return [];
    }
  }

  /**
   * 날짜 포맷팅
   * @param {string} dateStr
   * @returns {string}
   */
  function formatDate(dateStr) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * 게시글 카드 HTML 생성
   * @param {Object} post
   * @returns {string}
   */
  function createPostCard(post) {
    const tagsHtml = post.tags
      .map((tag) => `<span class="post-card-tag">${escapeHtml(tag)}</span>`)
      .join('');

    const categoryHtml = post.category
      ? `<span class="post-card-category">${escapeHtml(post.category)}</span>`
      : '';

    return `
      <a href="post.html?file=${encodeURIComponent(post.file)}" class="post-card">
        <div class="post-card-header">
          <h2 class="post-card-title">${escapeHtml(post.title)}</h2>
          <div class="post-card-meta">
            <span class="post-card-date">📅 ${formatDate(post.date)}</span>
            ${categoryHtml}
          </div>
        </div>
        <p class="post-card-excerpt">${escapeHtml(post.excerpt || post.description || '')}</p>
        ${tagsHtml ? `<div class="post-card-tags">${tagsHtml}</div>` : ''}
      </a>
    `;
  }

  /**
   * HTML 이스케이프
   * @param {string} text
   * @returns {string}
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 게시글 목록 렌더링
   * @param {Array} posts
   */
  function renderPosts(posts) {
    if (!postsGrid) return;

    if (posts.length === 0) {
      postsGrid.innerHTML = '';
      showEmptyState();
      return;
    }

    hideEmptyState();
    postsGrid.innerHTML = posts.map(createPostCard).join('');
  }

  /**
   * 태그 필터 렌더링
   */
  function renderTagsFilter() {
    if (!tagsFilter) return;

    // 모든 태그 수집
    allPosts.forEach((post) => {
      if (Array.isArray(post.tags)) {
        post.tags.forEach((tag) => allTags.add(tag));
      }
    });

    // 태그가 없으면 필터 숨기기
    if (allTags.size === 0) {
      tagsFilter.style.display = 'none';
      return;
    }

    // 태그 버튼 생성
    const tagsArray = Array.from(allTags).sort();
    const tagsHtml = tagsArray
      .map(
        (tag) =>
          `<button class="tag-btn" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`
      )
      .join('');

    tagsFilter.innerHTML = `
      <button class="tag-btn active" data-tag="all">전체</button>
      ${tagsHtml}
    `;

    // 태그 필터 이벤트 연결
    tagsFilter.addEventListener('click', handleTagFilter);
  }

  /**
   * 태그 필터 핸들러
   * @param {Event} e
   */
  function handleTagFilter(e) {
    const btn = e.target.closest('.tag-btn');
    if (!btn) return;

    const tag = btn.dataset.tag;

    // 활성 상태 업데이트
    tagsFilter.querySelectorAll('.tag-btn').forEach((b) => {
      b.classList.remove('active');
    });
    btn.classList.add('active');

    // 필터링
    if (tag === 'all') {
      renderPosts(allPosts);
      // 검색 모듈에 전달
      if (window.SearchManager) {
        window.SearchManager.setFilteredPosts(allPosts);
      }
    } else {
      const filtered = allPosts.filter(
        (post) => Array.isArray(post.tags) && post.tags.includes(tag)
      );
      renderPosts(filtered);
      // 검색 모듈에 전달
      if (window.SearchManager) {
        window.SearchManager.setFilteredPosts(filtered);
      }
    }
  }

  /**
   * 로딩 상태 표시
   */
  function showLoading() {
    if (loadingState) loadingState.style.display = 'flex';
    if (emptyState) emptyState.style.display = 'none';
    if (postsGrid) postsGrid.style.display = 'none';
  }

  /**
   * 로딩 상태 숨기기
   */
  function hideLoading() {
    if (loadingState) loadingState.style.display = 'none';
    if (postsGrid) postsGrid.style.display = 'grid';
  }

  /**
   * 빈 상태 표시
   */
  function showEmptyState() {
    if (emptyState) emptyState.style.display = 'flex';
    if (postsGrid) postsGrid.style.display = 'none';
  }

  /**
   * 빈 상태 숨기기
   */
  function hideEmptyState() {
    if (emptyState) emptyState.style.display = 'none';
    if (postsGrid) postsGrid.style.display = 'grid';
  }

  /**
   * 앱 초기화
   */
  async function init() {
    // 게시글 페이지에서는 실행하지 않음
    if (!postsGrid) return;

    showLoading();

    // 게시글 로드
    allPosts = await loadPosts();

    // 검색 모듈에 게시글 전달
    if (window.SearchManager) {
      window.SearchManager.setPosts(allPosts);
    }

    hideLoading();

    // 렌더링
    renderPosts(allPosts);
    renderTagsFilter();
  }

  // 전역 API 노출
  window.AppManager = {
    getPosts: () => allPosts,
    renderPosts: renderPosts,
    getTags: () => Array.from(allTags),
  };

  // DOM 로드 후 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

