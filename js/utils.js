/**
 * ═══════════════════════════════════════════════════════
 * 바이탈그라피 생기코치 - 유틸리티 함수
 * ═══════════════════════════════════════════════════════
 */

const Utils = {
  /**
   * UUID 생성
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * 현재 시간 포맷팅
   */
  formatTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  },

  /**
   * 날짜 포맷팅
   */
  formatDate(date = new Date()) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 한글 날짜
   */
  formatKoreanDate(date = new Date()) {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = days[date.getDay()];
    return `${month}월 ${day}일 (${dayOfWeek})`;
  },

  /**
   * 가격 포맷팅
   */
  formatPrice(price) {
    return price.toLocaleString('ko-KR') + '원';
  },

  /**
   * 리필 주기 계산
   */
  calculateRefillDays(dosagePerDay, packSize) {
    return Math.floor(packSize / dosagePerDay);
  },

  /**
   * 리필 알림일 계산
   */
  calculateRefillNotificationDate(startDate, refillDays, notificationDaysBefore = 3) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + refillDays - notificationDaysBefore);
    return date;
  },

  /**
   * 로컬 스토리지에 저장
   */
  saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage save error:', e);
      return false;
    }
  },

  /**
   * 로컬 스토리지에서 로드
   */
  loadFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Storage load error:', e);
      return null;
    }
  },

  /**
   * 로컬 스토리지에서 삭제
   */
  removeFromStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage remove error:', e);
      return false;
    }
  },

  /**
   * 세션 스토리지에 저장
   */
  saveToSessionStorage(key, data) {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Session storage save error:', e);
      return false;
    }
  },

  /**
   * 세션 스토리지에서 로드
   */
  loadFromSessionStorage(key) {
    try {
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Session storage load error:', e);
      return null;
    }
  },

  /**
   * 디바운스
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * 토스트 메시지 표시
   */
  showToast(message, duration = 3000) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  },

  /**
   * 로딩 표시
   */
  showLoading(element) {
    const spinner = document.createElement('span');
    spinner.className = 'loading-indicator';
    element.appendChild(spinner);
    return spinner;
  },

  /**
   * 로딩 숨김
   */
  hideLoading(spinner) {
    if (spinner && spinner.parentNode) {
      spinner.parentNode.removeChild(spinner);
    }
  },

  /**
   * API 호출
   */
  async fetchAPI(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, mergedOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API fetch error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 쿠키 설정
   */
  setCookie(name, value, days = 365) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  },

  /**
   * 쿠키 가져오기
   */
  getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  /**
   * 쿠키 삭제
   */
  deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
  },

  /**
   * URL 파라미터 가져오기
   */
  getURLParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  /**
   * 디바이스 타입 감지
   */
  getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return "tablet";
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return "mobile";
    }
    return "desktop";
  },

  /**
   * 온라인 상태 확인
   */
  isOnline() {
    return navigator.onLine;
  },

  /**
   * 데이터 유효성 검사
   */
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  validatePhone(phone) {
    const re = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
    return re.test(phone);
  },

  /**
   * 에러 로깅
   */
  logError(context, error) {
    const errorLog = {
      context,
      error: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    
    console.error('Error Log:', errorLog);
    
    // 서버로 에러 전송 (옵션)
    if (CONFIG.settings.debugMode) {
      this.fetchAPI(CONFIG.backend.apiUrl + '/api/logs/error', {
        method: 'POST',
        body: JSON.stringify(errorLog),
      }).catch(e => console.error('Failed to send error log:', e));
    }
  },

  /**
   * 딥 클론
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * 객체 병합
   */
  mergeObjects(target, source) {
    return Object.assign({}, target, source);
  },

  /**
   * 배열 섞기
   */
  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
};
