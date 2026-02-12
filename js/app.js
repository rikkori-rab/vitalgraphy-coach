/**
 * ═══════════════════════════════════════════════════════
 * 바이탈그라피 생기코치 - 메인 앱 로직
 * ═══════════════════════════════════════════════════════
 */

class WellnessCoach {
  constructor() {
    this.currentScreen = 1;
    this.selectedAnswers = {
      goal: null,
      sleep: '6~7시간',
      caffeine: '3잔 이상',
      exercise: '거의 안 함',
      form: '💊 캡슐',
      allergies: ['없음'],
    };
    
    this.init();
  }

  /**
   * 초기화
   */
  init() {
    this.setupEventListeners();
    this.checkExistingSession();
    this.initializeServiceWorker();
    this.fixMobileViewport();
  }

  /**
   * 모바일 뷰포트 높이 수정
   */
  fixMobileViewport() {
    // 모바일 브라우저 주소창 문제 해결
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
  }

  /**
   * 기존 세션 확인
   */
  checkExistingSession() {
    const existingData = dataManager.loadConsultationData();
    if (existingData.completedAt) {
      // 이전 세션 복원 옵션 제공
      if (confirm('이전에 완료한 문진이 있습니다. 이어서 진행하시겠습니까?')) {
        this.goScreen(5);
      }
    }
  }

  /**
   * Service Worker 초기화 (PWA)
   */
  async initializeServiceWorker() {
    if ('serviceWorker' in navigator && CONFIG.settings.enablePWA) {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 온라인/오프라인 상태 감지
    window.addEventListener('online', () => {
      Utils.showToast('인터넷에 연결되었습니다');
      this.hideOfflineIndicator();
    });

    window.addEventListener('offline', () => {
      Utils.showToast('인터넷 연결이 끊겼습니다. 오프라인 모드로 전환합니다.');
      this.showOfflineIndicator();
    });

    // 페이지 나가기 전 경고
    window.addEventListener('beforeunload', (e) => {
      if (this.currentScreen > 1 && this.currentScreen < 5) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  /**
   * 화면 전환
   */
  goScreen(n) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen' + n).classList.add('active');
    
    const screen = document.getElementById('screen' + n);
    const animated = screen.querySelectorAll('[class*="delay-"]');
    animated.forEach(el => {
      el.style.animation = 'none';
      el.offsetHeight;
      el.style.animation = '';
    });
    
    const body = screen.querySelector('.chat-body');
    if (body) body.scrollTop = 0;
    setTimeout(() => { if (body) body.scrollTop = body.scrollHeight; }, 4500);
    
    this.currentScreen = n;
    
    // 페이지뷰 트래킹
    dataManager.trackEvent('page_view', { screen: n });
  }

  /**
   * Single Select 토글
   */
  toggleSingle(el) {
    const container = el.parentElement;
    const group = container.dataset.group;
    
    container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    
    // 선택값 저장
    this.selectedAnswers[group] = el.textContent.trim();
    
    // DataManager에 저장
    if (['sleep', 'caffeine', 'exercise'].includes(group)) {
      dataManager.setLifestyle(group, el.textContent.trim());
    } else if (['form'].includes(group)) {
      dataManager.setPreference(group, el.textContent.trim());
    }
  }

  /**
   * Multi Select 토글
   */
  toggleMulti(el) {
    const container = el.parentElement;
    const group = container.dataset.group;
    const isNone = el.textContent.trim() === '없음';

    if (isNone) {
      container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      this.selectedAnswers[group] = ['없음'];
    } else {
      container.querySelectorAll('.chip').forEach(c => {
        if (c.textContent.trim() === '없음') c.classList.remove('active');
      });
      el.classList.toggle('active');
      
      // 선택된 항목들 수집
      const selected = Array.from(container.querySelectorAll('.chip.active'))
        .map(c => c.textContent.trim());
      
      if (selected.length === 0) {
        container.querySelectorAll('.chip').forEach(c => {
          if (c.textContent.trim() === '없음') c.classList.add('active');
        });
        this.selectedAnswers[group] = ['없음'];
      } else {
        this.selectedAnswers[group] = selected;
      }
    }
    
    // DataManager에 저장
    dataManager.setPreference(group, this.selectedAnswers[group]);
  }

  /**
   * 목표 선택
   */
  selectGoal(goal) {
    this.selectedAnswers.goal = goal;
    dataManager.setGoal(goal);
    this.goScreen(3);
  }

  /**
   * 동의 체크박스 토글
   */
  toggleConsent(id, isRequired) {
    const el = document.getElementById(id);
    if (!el) return;
    
    // 필수 항목은 체크만 가능 (체크 해제 불가)
    if (isRequired && el.classList.contains('checked')) return;
    
    el.classList.add('checked');
    this.updateConsentBtn();
  }

  /**
   * 동의 버튼 업데이트
   */
  updateConsentBtn() {
    const chk1 = document.getElementById('chk1');
    const btn = document.getElementById('consentBtn');
    if (!chk1 || !btn) return;
    
    if (chk1.classList.contains('checked')) {
      btn.classList.add('enabled');
    } else {
      btn.classList.remove('enabled');
    }
  }

  /**
   * 추천 결과 생성
   */
  async generateRecommendation() {
    const consultationData = {
      goal: this.selectedAnswers.goal,
      lifestyle: {
        sleep: this.selectedAnswers.sleep,
        caffeine: this.selectedAnswers.caffeine,
        exercise: this.selectedAnswers.exercise,
      },
      preferences: {
        form: this.selectedAnswers.form,
        allergies: this.selectedAnswers.allergies,
      },
    };

    // 추천 생성
    const recommendation = await recommendationEngine.generateRecommendation(consultationData);
    
    // 결과 저장
    dataManager.saveRecommendation(recommendation);
    
    return recommendation;
  }

  /**
   * 추천 결과 화면 렌더링
   */
  async renderRecommendation() {
    const recommendation = await this.generateRecommendation();
    
    // 루틴 카드 업데이트
    this.updateRoutineCard(recommendation);
    
    // 화면 이동
    this.goScreen(5);
  }

  /**
   * 루틴 카드 업데이트
   */
  updateRoutineCard(recommendation) {
    const { products, routine, refillInfo, reasoning } = recommendation;
    
    // 추천 이유 업데이트
    const reasoningEl = document.querySelector('.routine-reason p');
    if (reasoningEl) {
      reasoningEl.innerHTML = `
        <span class="reason-icon">💡</span>
        <strong>왜 이 루틴인가요?</strong><br>
        ${reasoning}
      `;
    }
    
    // 루틴 아이템 업데이트
    const routineBody = document.querySelector('.routine-card-body');
    if (routineBody) {
      routineBody.innerHTML = routine.map(item => `
        <div class="routine-item">
          <span class="routine-time">${item.time}</span>
          <div class="routine-detail">
            <div class="product-name">${item.product}</div>
            <div class="product-desc">${item.description}</div>
          </div>
        </div>
      `).join('');
    }
    
    // 리필 정보 업데이트
    const refillBadge = document.querySelector('.refill-badge');
    const refillText = document.querySelector('.refill-text');
    if (refillBadge && refillText && refillInfo) {
      refillBadge.textContent = `📦 ${refillInfo.period}분`;
      refillText.textContent = `하루 ${refillInfo.totalDosagePerDay}캡슐 기준 · 리필 알림은 소진 ${refillInfo.notificationDaysBefore}일 전에 발송`;
    }
  }

  /**
   * 장바구니에 추가
   */
  async addToCart() {
    const recommendation = dataManager.consultationData.recommendation;
    if (!recommendation) {
      Utils.showToast('추천 정보를 찾을 수 없습니다');
      return;
    }

    const products = recommendation.products;
    
    // DataManager를 통해 장바구니에 추가
    const success = await dataManager.addToCart(products);
    
    if (success) {
      Utils.showToast('장바구니에 추가되었습니다! 🛒');
      
      // 카페24 장바구니로 리다이렉트 (옵션)
      setTimeout(() => {
        if (confirm('장바구니로 이동하시겠습니까?')) {
          window.location.href = 'https://vitalgraphi.com/cart';
        }
      }, 1000);
    } else {
      Utils.showToast('장바구니 추가에 실패했습니다');
    }
  }

  /**
   * 리필 알림 모달 표시
   */
  showRefillModal() {
    document.getElementById('refillModal').classList.add('show');
  }

  /**
   * 리필 알림 모달 닫기
   */
  closeRefillModal() {
    const checkbox = document.getElementById('refillChk');
    const channel = document.querySelector('.channel-option.active')?.textContent.trim();
    
    if (checkbox && checkbox.classList.contains('checked')) {
      dataManager.saveMarketingConsent(true, channel);
      Utils.showToast('리필 알림이 설정되었습니다! 🔔');
    }
    
    document.getElementById('refillModal').classList.remove('show');
  }

  /**
   * 회원가입 모달 표시
   */
  showSignupModal() {
    document.getElementById('signupModal').classList.add('show');
    this.checkSignup();
  }

  /**
   * 회원가입 모달 닫기
   */
  closeSignupModal() {
    const checkbox = document.getElementById('signChk1');
    
    if (checkbox && checkbox.classList.contains('checked')) {
      // 실제로는 이메일 입력 폼이 필요하지만, 간단한 데모를 위해 임시로 처리
      const email = prompt('이메일을 입력해주세요:');
      if (email && Utils.validateEmail(email)) {
        dataManager.saveCustomerInfo({
          email,
          name: null,
          phone: null,
        });
        Utils.showToast('회원가입이 완료되었습니다! 💾');
      }
    }
    
    document.getElementById('signupModal').classList.remove('show');
  }

  /**
   * 회원가입 유효성 검사
   */
  checkSignup() {
    const chk = document.getElementById('signChk1');
    const btn = document.getElementById('signupBtn');
    if (!chk || !btn) return;
    
    btn.style.opacity = chk.classList.contains('checked') ? '1' : '0.4';
    btn.style.pointerEvents = chk.classList.contains('checked') ? 'auto' : 'none';
  }

  /**
   * 채널 선택
   */
  selectChannel(el) {
    el.parentElement.querySelectorAll('.channel-option').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
  }

  /**
   * 오프라인 표시
   */
  showOfflineIndicator() {
    let indicator = document.querySelector('.offline-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'offline-indicator';
      indicator.innerHTML = `
        <div style="font-size: 32px; margin-bottom: 10px;">📡</div>
        <div style="font-size: 16px; font-weight: 700;">오프라인 모드</div>
        <div style="font-size: 12px; margin-top: 8px;">인터넷 연결을 확인해주세요</div>
      `;
      document.querySelector('.phone-frame').appendChild(indicator);
    }
    indicator.classList.add('show');
  }

  /**
   * 오프라인 표시 숨김
   */
  hideOfflineIndicator() {
    const indicator = document.querySelector('.offline-indicator');
    if (indicator) {
      indicator.classList.remove('show');
    }
  }
}

// 전역 변수로 앱 인스턴스 생성
let app;

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
  app = new WellnessCoach();
  
  // 모달 오버레이 클릭 시 닫기
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('show');
      }
    });
  });
});

// 전역 함수 (HTML에서 직접 호출)
function goScreen(n) {
  app.goScreen(n);
}

function toggleSingle(el) {
  app.toggleSingle(el);
}

function toggleMulti(el) {
  app.toggleMulti(el);
}

function toggleConsent(id, isRequired) {
  app.toggleConsent(id, isRequired);
}

function selectChannel(el) {
  app.selectChannel(el);
}

function showRefillModal() {
  app.showRefillModal();
}

function closeRefillModal() {
  app.closeRefillModal();
}

function showSignupModal() {
  app.showSignupModal();
}

function closeSignupModal() {
  app.closeSignupModal();
}

function checkSignup() {
  app.checkSignup();
}

async function handleGenerateRecommendation() {
  await app.renderRecommendation();
}

async function handleAddToCart() {
  await app.addToCart();
}
