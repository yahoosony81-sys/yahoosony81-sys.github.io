/**
 * Search Manager - 게시글 검색 기능
 * yahoosony81-sys Blog
 */

(function () {
  'use strict';

  // 전역 변수 (search 전용)
  let searchPosts = [];
  let filteredByTag = [];
  let searchTimeout = null;

  // DOM 요소
  const searchInput = document.getElementById('search-input');
  const postsGrid = document.getElementById('posts-grid');
  const emptyState = document.getElementById('empty-state');

  /**
   * 검색어 정규화 (공백, 대소문자 처리)
   * @param {string} text
   * @returns {string}
   */
  function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * 게시글 검색
   * @param {string} query
   * @returns {Array}
   */
  function searchByQuery(query) {
    const normalizedQuery = normalizeText(query);
    
    if (!normalizedQuery) {
      return filteredByTag.length > 0 ? filteredByTag : searchPosts;
    }

    const basePosts = filteredByTag.length > 0 ? filteredByTag : searchPosts;
    
    return basePosts.filter((post) => {
      // 제목 검색
      if (normalizeText(post.title).includes(normalizedQuery)) {
        return true;
      }
      
      // 설명 검색
      if (normalizeText(post.description).includes(normalizedQuery)) {
        return true;
      }
      
      // 발췌문 검색
      if (normalizeText(post.excerpt).includes(normalizedQuery)) {
        return true;
      }
      
      // 태그 검색
      if (Array.isArray(post.tags)) {
        const tagMatch = post.tags.some((tag) =>
          normalizeText(tag).includes(normalizedQuery)
        );
        if (tagMatch) return true;
      }
      
      // 카테고리 검색
      if (normalizeText(post.category).includes(normalizedQuery)) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * 검색 결과 렌더링
   * @param {Array} results
   */
  function renderSearchResults(results) {
    if (!window.AppManager) {
      console.warn('AppManager not found');
      return;
    }

    window.AppManager.renderPosts(results);
  }

  /**
   * 디바운스된 검색 실행
   * @param {string} query
   */
  function performSearch(query) {
    // 이전 타이머 취소
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // 200ms 후 검색 실행 (타이핑 중 과도한 검색 방지)
    searchTimeout = setTimeout(() => {
      const results = searchByQuery(query);
      renderSearchResults(results);
    }, 200);
  }

  /**
   * 검색 입력 핸들러
   * @param {Event} e
   */
  function handleSearchInput(e) {
    const query = e.target.value;
    performSearch(query);
  }

  /**
   * 검색 초기화
   */
  function clearSearch() {
    if (searchInput) {
      searchInput.value = '';
    }
    
    const basePosts = filteredByTag.length > 0 ? filteredByTag : searchPosts;
    renderSearchResults(basePosts);
  }

  /**
   * 이벤트 리스너 설정
   */
  function setupEventListeners() {
    if (searchInput) {
      // 입력 이벤트
      searchInput.addEventListener('input', handleSearchInput);
      
      // ESC 키로 검색어 초기화
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          clearSearch();
        }
      });
      
      // 포커스 시 전체 선택 (편의성)
      searchInput.addEventListener('focus', () => {
        searchInput.select();
      });
    }
  }

  /**
   * 게시글 목록 설정 (app.js에서 호출)
   * @param {Array} posts
   */
  function setPosts(posts) {
    searchPosts = posts || [];
    filteredByTag = [];
  }

  /**
   * 태그 필터링된 게시글 설정 (app.js에서 호출)
   * @param {Array} posts
   */
  function setFilteredPosts(posts) {
    filteredByTag = posts || [];
    
    // 현재 검색어로 다시 검색
    if (searchInput && searchInput.value) {
      performSearch(searchInput.value);
    }
  }

  /**
   * 초기화
   */
  function init() {
    // 메인 페이지에서만 실행
    if (!searchInput) return;

    setupEventListeners();
  }

  // 전역 API 노출
  window.SearchManager = {
    setPosts: setPosts,
    setFilteredPosts: setFilteredPosts,
    search: searchByQuery,
    clear: clearSearch,
  };

  // DOM 로드 후 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

