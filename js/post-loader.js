/**
 * Post Loader - 마크다운 로딩, 파싱, Giscus 연동
 * yahoosony81-sys Blog
 */

(function () {
  'use strict';

  // DOM 요소
  const postTitle = document.getElementById('post-title');
  const postDate = document.getElementById('post-date');
  const postCategory = document.getElementById('post-category');
  const postTags = document.getElementById('post-tags');
  const postContent = document.getElementById('post-content');
  const giscusContainer = document.getElementById('giscus-container');

  /**
   * URL에서 파일명 추출
   * @returns {string|null}
   */
  function getPostFile() {
    const params = new URLSearchParams(window.location.search);
    return params.get('file');
  }

  /**
   * 마크다운 파일 로드
   * @param {string} filename
   * @returns {Promise<string>}
   */
  async function loadMarkdown(filename) {
    const response = await fetch(`pages/${filename}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load post: ${response.status}`);
    }
    
    let text = await response.text();
    
    // UTF-8 BOM 제거 (Windows 호환)
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }
    
    return text;
  }

  /**
   * Front Matter 파싱
   * @param {string} content
   * @returns {{metadata: Object, content: string}}
   */
  function parseFrontMatter(content) {
    // Windows 줄바꿈 지원
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    
    if (!match) {
      return { metadata: {}, content: content };
    }

    const frontMatter = match[1];
    const postContent = match[2];
    const metadata = {};

    // 각 줄 파싱 (Windows 줄바꿈 지원)
    const lines = frontMatter.split(/\r?\n/);
    lines.forEach((line) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        // 따옴표 제거
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        // 배열 파싱 (tags)
        if (key === 'tags' && value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value);
          } catch {
            value = value
              .slice(1, -1)
              .split(',')
              .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ''));
          }
        }

        metadata[key] = value;
      }
    });

    return { metadata, content: postContent };
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
   * 마크다운을 HTML로 변환
   * @param {string} markdown
   * @returns {string}
   */
  function renderMarkdown(markdown) {
    // marked.js 설정
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false,
        highlight: function (code, lang) {
          // Prism.js로 하이라이팅
          if (typeof Prism !== 'undefined' && lang && Prism.languages[lang]) {
            try {
              return Prism.highlight(code, Prism.languages[lang], lang);
            } catch {
              return code;
            }
          }
          return code;
        },
      });
      
      return marked.parse(markdown);
    }
    
    // marked.js가 없으면 기본 변환
    return markdown
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }

  /**
   * 메타데이터 렌더링
   * @param {Object} metadata
   */
  function renderMetadata(metadata) {
    // 제목
    if (postTitle) {
      postTitle.textContent = metadata.title || '제목 없음';
      document.title = `${metadata.title || '게시글'} - yahoosony81-sys Blog`;
    }

    // 날짜
    if (postDate && metadata.date) {
      postDate.textContent = formatDate(metadata.date);
    }

    // 카테고리
    if (postCategory && metadata.category) {
      postCategory.textContent = metadata.category;
      postCategory.style.display = 'inline-block';
    }

    // 태그
    if (postTags && Array.isArray(metadata.tags) && metadata.tags.length > 0) {
      postTags.innerHTML = metadata.tags
        .map((tag) => `<span class="post-tag">${escapeHtml(tag)}</span>`)
        .join('');
    }
  }

  /**
   * Giscus 댓글 시스템 로드
   */
  function loadGiscus() {
    if (!giscusContainer) return;

    // Giscus 설정
    // ⚠️ 아래 값들을 본인의 GitHub 저장소 정보로 변경하세요!
    // https://giscus.app/ko 에서 설정값을 얻을 수 있습니다.
    
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'yahoosony81-sys/yahoosony81-sys.github.io');
    script.setAttribute('data-repo-id', 'YOUR_REPO_ID'); // giscus.app에서 복사
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'YOUR_CATEGORY_ID'); // giscus.app에서 복사
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '1');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'preferred_color_scheme');
    script.setAttribute('data-lang', 'ko');
    script.setAttribute('data-loading', 'lazy');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    giscusContainer.appendChild(script);

    // 테마 변경 시 Giscus 테마도 변경
    window.addEventListener('themechange', (e) => {
      const iframe = document.querySelector('iframe.giscus-frame');
      if (iframe) {
        iframe.contentWindow.postMessage(
          {
            giscus: {
              setConfig: {
                theme: e.detail.theme === 'dark' ? 'dark' : 'light',
              },
            },
          },
          'https://giscus.app'
        );
      }
    });
  }

  /**
   * 코드 하이라이팅 적용
   */
  function highlightCode() {
    if (typeof Prism !== 'undefined') {
      // 약간의 지연 후 실행 (DOM 업데이트 대기)
      setTimeout(() => {
        Prism.highlightAll();
      }, 100);
    }
  }

  /**
   * 에러 표시
   * @param {string} message
   */
  function showError(message) {
    if (postContent) {
      postContent.innerHTML = `
        <div class="error-state">
          <span class="error-icon">😢</span>
          <h2>게시글을 불러올 수 없습니다</h2>
          <p>${escapeHtml(message)}</p>
          <a href="index.html" class="post-nav-link">
            <span>← 목록으로 돌아가기</span>
          </a>
        </div>
      `;
    }
    
    if (postTitle) {
      postTitle.textContent = '오류';
    }
  }

  /**
   * 게시글 로드 및 렌더링
   */
  async function loadPost() {
    const filename = getPostFile();

    if (!filename) {
      showError('게시글 파일이 지정되지 않았습니다.');
      return;
    }

    try {
      // 마크다운 로드
      const rawContent = await loadMarkdown(filename);

      // Front Matter 파싱
      const { metadata, content } = parseFrontMatter(rawContent);

      // 메타데이터 렌더링
      renderMetadata(metadata);

      // 마크다운 → HTML 변환
      const htmlContent = renderMarkdown(content);

      // 본문 렌더링
      if (postContent) {
        postContent.innerHTML = htmlContent;
      }

      // 코드 하이라이팅
      highlightCode();

      // Giscus 댓글 로드
      loadGiscus();

    } catch (error) {
      console.error('Failed to load post:', error);
      showError(error.message || '알 수 없는 오류가 발생했습니다.');
    }
  }

  /**
   * 초기화
   */
  function init() {
    // 게시글 페이지에서만 실행
    if (!postContent) return;

    loadPost();
  }

  // DOM 로드 후 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

