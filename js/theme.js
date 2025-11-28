/**
 * Theme Manager - 다크/라이트 모드 토글
 * yahoosony81-sys Blog
 */

(function () {
  'use strict';

  // 테마 상수
  const THEME_KEY = 'blog-theme';
  const DARK_THEME = 'dark';
  const LIGHT_THEME = 'light';

  /**
   * 시스템 다크 모드 설정 확인
   * @returns {boolean}
   */
  function prefersDarkMode() {
    return (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }

  /**
   * 저장된 테마 가져오기
   * @returns {string|null}
   */
  function getSavedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      console.warn('localStorage not available:', e);
      return null;
    }
  }

  /**
   * 테마 저장
   * @param {string} theme
   */
  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.warn('Failed to save theme:', e);
    }
  }

  /**
   * 현재 테마 가져오기
   * @returns {string}
   */
  function getCurrentTheme() {
    const savedTheme = getSavedTheme();
    if (savedTheme) {
      return savedTheme;
    }
    return prefersDarkMode() ? DARK_THEME : LIGHT_THEME;
  }

  /**
   * 테마 적용
   * @param {string} theme
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // meta theme-color 업데이트 (모바일 브라우저용)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        theme === DARK_THEME ? '#0d0d0d' : '#faf9f7'
      );
    }
  }

  /**
   * 테마 토글
   */
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    
    applyTheme(newTheme);
    saveTheme(newTheme);
    
    // 커스텀 이벤트 발생 (다른 스크립트에서 사용 가능)
    window.dispatchEvent(
      new CustomEvent('themechange', { detail: { theme: newTheme } })
    );
  }

  /**
   * 테마 토글 버튼 초기화
   */
  function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleTheme);
      
      // 키보드 접근성
      toggleBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTheme();
        }
      });
    }
  }

  /**
   * 시스템 테마 변경 감지
   */
  function watchSystemTheme() {
    if (window.matchMedia) {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          // 사용자가 직접 설정한 테마가 없을 때만 자동 변경
          if (!getSavedTheme()) {
            applyTheme(e.matches ? DARK_THEME : LIGHT_THEME);
          }
        });
    }
  }

  /**
   * 초기화
   */
  function init() {
    // 초기 테마 적용 (깜빡임 방지를 위해 가능한 빨리 실행)
    applyTheme(getCurrentTheme());
    
    // DOM 로드 후 이벤트 리스너 연결
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initThemeToggle);
    } else {
      initThemeToggle();
    }
    
    // 시스템 테마 변경 감지
    watchSystemTheme();
  }

  // 전역 API 노출 (선택적 사용)
  window.ThemeManager = {
    toggle: toggleTheme,
    get: getCurrentTheme,
    set: applyTheme,
    isDark: () => getCurrentTheme() === DARK_THEME,
  };

  // 즉시 초기화
  init();
})();

