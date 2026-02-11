/**
 * ═══════════════════════════════════════════════════════
 * 바이탈그라피 생기코치 - 데이터 관리자
 * ═══════════════════════════════════════════════════════
 */

class DataManager {
  constructor() {
    this.sessionId = this.initializeSession();
    this.customerData = this.loadCustomerData();
    this.consultationData = this.loadConsultationData();
    this.autoSaveInterval = null;
    
    this.initializeAutoSave();
  }

  /**
   * 세션 초기화
   */
  initializeSession() {
    let sessionId = Utils.loadFromSessionStorage(CONFIG.storageKeys.sessionId);
    
    if (!sessionId) {
      sessionId = Utils.generateUUID();
      Utils.saveToSessionStorage(CONFIG.storageKeys.sessionId, sessionId);
      
      // 세션 시작 이벤트 전송
      this.trackEvent('session_start', { sessionId });
    }
    
    return sessionId;
  }

  /**
   * 고객 데이터 로드
   */
  loadCustomerData() {
    return Utils.loadFromStorage(CONFIG.storageKeys.customerData) || {
      customerId: null,
      email: null,
      phone: null,
      name: null,
      marketingConsent: false,
      marketingChannel: null,
      createdAt: null,
      lastVisit: new Date().toISOString(),
    };
  }

  /**
   * 문진 데이터 로드
   */
  loadConsultationData() {
    return Utils.loadFromStorage(CONFIG.storageKeys.consultationData) || {
      goal: null,
      lifestyle: {
        sleep: null,
        caffeine: null,
        exercise: null,
      },
      preferences: {
        form: null,
        allergies: [],
      },
      recommendation: null,
      completedAt: null,
    };
  }

  /**
   * 고객 데이터 저장
   */
  saveCustomerData(data) {
    this.customerData = { ...this.customerData, ...data };
    Utils.saveToStorage(CONFIG.storageKeys.customerData, this.customerData);
    
    // 서버에도 저장
    this.syncCustomerToServer();
  }

  /**
   * 문진 데이터 저장
   */
  saveConsultationData(data) {
    this.consultationData = { ...this.consultationData, ...data };
    Utils.saveToStorage(CONFIG.storageKeys.consultationData, this.consultationData);
  }

  /**
   * 목표 설정
   */
  setGoal(goal) {
    this.saveConsultationData({ goal });
    this.trackEvent('goal_selected', { goal });
  }

  /**
   * 생활 패턴 저장
   */
  setLifestyle(key, value) {
    const lifestyle = { ...this.consultationData.lifestyle, [key]: value };
    this.saveConsultationData({ lifestyle });
    this.trackEvent('lifestyle_updated', { key, value });
  }

  /**
   * 선호도 저장
   */
  setPreference(key, value) {
    const preferences = { ...this.consultationData.preferences, [key]: value };
    this.saveConsultationData({ preferences });
    this.trackEvent('preference_updated', { key, value });
  }

  /**
   * 추천 결과 저장
   */
  saveRecommendation(recommendation) {
    this.consultationData.recommendation = recommendation;
    this.consultationData.completedAt = new Date().toISOString();
    Utils.saveToStorage(CONFIG.storageKeys.consultationData, this.consultationData);
    
    this.trackEvent('consultation_completed', {
      goal: this.consultationData.goal,
      productCount: recommendation.products.length,
    });
    
    // 서버에 저장
    this.syncConsultationToServer();
  }

  /**
   * 마케팅 동의 저장
   */
  saveMarketingConsent(consent, channel = null) {
    this.saveCustomerData({
      marketingConsent: consent,
      marketingChannel: channel,
    });
    
    this.trackEvent('marketing_consent', { consent, channel });
  }

  /**
   * 고객 정보 저장 (회원가입)
   */
  saveCustomerInfo(info) {
    this.saveCustomerData({
      ...info,
      createdAt: new Date().toISOString(),
    });
    
    this.trackEvent('customer_registered', {
      email: info.email,
    });
  }

  /**
   * 서버에 고객 데이터 동기화
   */
  async syncCustomerToServer() {
    if (!CONFIG.backend.apiUrl) {
      console.warn('Backend API URL not configured');
      return;
    }

    const payload = {
      sessionId: this.sessionId,
      customerData: this.customerData,
      timestamp: new Date().toISOString(),
    };

    const result = await Utils.fetchAPI(
      CONFIG.backend.apiUrl + CONFIG.backend.endpoints.saveCustomer,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    if (result.success) {
      console.log('Customer data synced to server');
    } else {
      console.error('Failed to sync customer data:', result.error);
    }
  }

  /**
   * 서버에 문진 데이터 동기화
   */
  async syncConsultationToServer() {
    if (!CONFIG.backend.apiUrl) {
      console.warn('Backend API URL not configured');
      return;
    }

    const payload = {
      sessionId: this.sessionId,
      customerId: this.customerData.customerId,
      consultationData: this.consultationData,
      timestamp: new Date().toISOString(),
    };

    const result = await Utils.fetchAPI(
      CONFIG.backend.apiUrl + CONFIG.backend.endpoints.saveConsultation,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    if (result.success) {
      console.log('Consultation data synced to server');
      
      // CRM 시스템에도 전송
      this.sendToCRM();
    } else {
      console.error('Failed to sync consultation data:', result.error);
    }
  }

  /**
   * CRM 시스템에 데이터 전송
   */
  async sendToCRM() {
    if (!CONFIG.crm.webhookUrl && !CONFIG.backend.endpoints.sendCRM) {
      console.warn('CRM endpoint not configured');
      return;
    }

    const crmPayload = {
      sessionId: this.sessionId,
      customer: this.customerData,
      consultation: this.consultationData,
      source: 'wellness_coach',
      timestamp: new Date().toISOString(),
    };

    const endpoint = CONFIG.crm.webhookUrl || 
                    (CONFIG.backend.apiUrl + CONFIG.backend.endpoints.sendCRM);

    const result = await Utils.fetchAPI(endpoint, {
      method: 'POST',
      body: JSON.stringify(crmPayload),
    });

    if (result.success) {
      console.log('Data sent to CRM');
    } else {
      console.error('Failed to send data to CRM:', result.error);
    }
  }

  /**
   * 자동 저장 초기화
   */
  initializeAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(() => {
      this.syncConsultationToServer();
    }, CONFIG.settings.autoSaveInterval);
  }

  /**
   * 이벤트 트래킹
   */
  trackEvent(eventName, eventData = {}) {
    const event = {
      name: eventName,
      data: eventData,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      device: Utils.getDeviceType(),
    };

    console.log('Track Event:', event);

    // Google Analytics
    if (window.gtag && CONFIG.analytics.googleAnalytics) {
      gtag('event', eventName, eventData);
    }

    // Kakao Pixel
    if (window.kakaoPixel && CONFIG.analytics.kakaoPixel) {
      kakaoPixel(CONFIG.analytics.kakaoPixel).track(eventName, eventData);
    }

    // Facebook Pixel
    if (window.fbq && CONFIG.analytics.facebookPixel) {
      fbq('track', eventName, eventData);
    }

    // 서버 로깅 (백엔드 API가 설정된 경우에만)
    if (CONFIG.backend.apiUrl && CONFIG.backend.apiUrl !== '') {
      Utils.fetchAPI(CONFIG.backend.apiUrl + '/api/events', {
        method: 'POST',
        body: JSON.stringify(event),
      }).catch(e => {
        if (CONFIG.settings.debugMode) {
          console.warn('Backend API not configured:', e);
        }
      });
    }
  }

  /**
   * 장바구니에 추가
   */
  async addToCart(products) {
    const cartData = {
      sessionId: this.sessionId,
      customerId: this.customerData.customerId,
      products: products.map(p => ({
        productId: p.id,
        productName: p.name,
        quantity: 1,
        price: p.price,
      })),
      timestamp: new Date().toISOString(),
    };

    // 로컬 저장
    Utils.saveToStorage(CONFIG.storageKeys.cartData, cartData);

    // 서버에 전송
    if (CONFIG.backend.apiUrl) {
      const result = await Utils.fetchAPI(
        CONFIG.backend.apiUrl + CONFIG.backend.endpoints.addToCart,
        {
          method: 'POST',
          body: JSON.stringify(cartData),
        }
      );

      if (result.success) {
        this.trackEvent('add_to_cart', {
          products: products.map(p => p.name),
          totalPrice: products.reduce((sum, p) => sum + p.price, 0),
        });
        return true;
      }
    }

    return false;
  }

  /**
   * 데이터 초기화
   */
  reset() {
    Utils.removeFromStorage(CONFIG.storageKeys.consultationData);
    this.consultationData = this.loadConsultationData();
    this.trackEvent('data_reset');
  }

  /**
   * 전체 데이터 내보내기
   */
  exportData() {
    return {
      sessionId: this.sessionId,
      customer: this.customerData,
      consultation: this.consultationData,
      exportedAt: new Date().toISOString(),
    };
  }
}

// 전역 인스턴스 생성
const dataManager = new DataManager();
