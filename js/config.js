/**
 * ═══════════════════════════════════════════════════════
 * 바이탈그라피 생기코치 - 설정 파일
 * ═══════════════════════════════════════════════════════
 */

const CONFIG = {
  // 카페24 API 설정
  cafe24: {
    mallId: 'vitalgraphi',  // 실제 쇼핑몰 ID로 변경
    apiUrl: 'https://vitalgraphi.cafe24api.com/api/v2',  // 실제 API URL로 변경
    clientId: '',  // 카페24 앱 클라이언트 ID
    clientSecret: '',  // 카페24 앱 클라이언트 시크릿
    accessToken: '',  // API 액세스 토큰 (서버에서 발급)
  },

  // 백엔드 API 설정 (데이터 저장용)
  backend: {
    apiUrl: 'https://api.vitalgraphi.com',  // 실제 백엔드 API URL로 변경
    endpoints: {
      saveConsultation: '/api/consultations',
      getProducts: '/api/products',
      getRecommendation: '/api/recommendations',
      saveCustomer: '/api/customers',
      sendCRM: '/api/crm/send',
      addToCart: '/api/cart/add',
      createOrder: '/api/orders/create',
      getInventory: '/api/inventory',
    }
  },

  // 제품 정보 (실제 카페24 제품 코드로 매핑)
  products: {
    'quercetin': {
      id: 'P0000001',  // 카페24 제품 코드
      name: '퀘르세틴 브로멜라인',
      description: '아침 식후 · 상쾌한 하루의 시작',
      price: 35000,
      dosagePerDay: 1,
      packSize: 30,
      category: 'freshness',
      image: '/assets/products/quercetin.jpg'
    },
    'magnesium': {
      id: 'P0000002',
      name: '마그네슘 비스글리시네이트',
      description: '저녁 식후 · 긴장 완화 & 숙면 서포트',
      price: 28000,
      dosagePerDay: 1,
      packSize: 30,
      category: 'sleep',
      image: '/assets/products/magnesium.jpg'
    },
    'probiotics': {
      id: 'P0000003',
      name: '프로바이오틱스 컴플렉스',
      description: '장 건강 · 소화 케어',
      price: 32000,
      dosagePerDay: 1,
      packSize: 30,
      category: 'digestion',
      image: '/assets/products/probiotics.jpg'
    },
    'collagen': {
      id: 'P0000004',
      name: '마린 콜라겐 펩타이드',
      description: '피부 탄력 · 광채 관리',
      price: 42000,
      dosagePerDay: 1,
      packSize: 30,
      category: 'skin',
      image: '/assets/products/collagen.jpg'
    },
    'bcaa': {
      id: 'P0000005',
      name: 'BCAA 리커버리',
      description: '운동 회복 · 근육 서포트',
      price: 38000,
      dosagePerDay: 2,
      packSize: 30,
      category: 'exercise',
      image: '/assets/products/bcaa.jpg'
    }
  },

  // 추천 로직 매핑
  recommendations: {
    freshness: {
      primary: ['quercetin', 'magnesium'],
      lifestyle: {
        highCaffeine: ['magnesium'],
        lowSleep: ['magnesium'],
        lowExercise: ['quercetin']
      }
    },
    sleep: {
      primary: ['magnesium'],
      lifestyle: {
        highCaffeine: ['magnesium'],
        lowSleep: ['magnesium']
      }
    },
    digestion: {
      primary: ['probiotics'],
      lifestyle: {
        lowExercise: ['probiotics']
      }
    },
    skin: {
      primary: ['collagen'],
      lifestyle: {
        lowSleep: ['collagen']
      }
    },
    exercise: {
      primary: ['bcaa', 'magnesium'],
      lifestyle: {
        highExercise: ['bcaa']
      }
    }
  },

  // 리필 주기 설정 (일수)
  refillPeriods: {
    14: '2주',
    21: '3주',
    28: '4주',
    30: '1개월',
    60: '2개월',
    90: '3개월'
  },

  // 분석 도구
  analytics: {
    googleAnalytics: '',  // GA4 측정 ID
    kakaoPixel: '',  // 카카오 픽셀 ID
    facebookPixel: '',  // 페이스북 픽셀 ID
  },

  // CRM 설정
  crm: {
    provider: 'custom',  // 'custom', 'salesforce', 'hubspot', etc.
    webhookUrl: '',  // CRM 웹훅 URL
  },

  // 알림 설정
  notifications: {
    kakao: {
      enabled: true,
      templateId: '',  // 카카오 알림톡 템플릿 ID
    },
    sms: {
      enabled: true,
      provider: 'aligo',  // 'aligo', 'coolsms', etc.
    },
    email: {
      enabled: true,
      provider: 'sendgrid',  // 'sendgrid', 'mailgun', etc.
    }
  },

  // 로컬 스토리지 키
  storageKeys: {
    sessionId: 'vg_session_id',
    customerData: 'vg_customer_data',
    consultationData: 'vg_consultation_data',
    cartData: 'vg_cart_data',
    preferences: 'vg_preferences',
  },

  // 기타 설정
  settings: {
    autoSaveInterval: 30000,  // 30초마다 자동 저장
    sessionTimeout: 3600000,  // 1시간
    enableOfflineMode: true,
    enablePWA: true,
    debugMode: false,  // 개발 모드
  }
};

// 환경 변수로 오버라이드 (프로덕션 배포 시)
if (typeof window !== 'undefined' && window.ENV_CONFIG) {
  Object.assign(CONFIG, window.ENV_CONFIG);
}
