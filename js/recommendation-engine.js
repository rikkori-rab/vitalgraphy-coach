/**
 * ═══════════════════════════════════════════════════════
 * 바이탈그라피 생기코치 - 추천 엔진
 * ═══════════════════════════════════════════════════════
 */

class RecommendationEngine {
  constructor() {
    this.products = CONFIG.products;
    this.recommendations = CONFIG.recommendations;
  }

  /**
   * 메인 추천 로직
   */
  async generateRecommendation(consultationData) {
    const { goal, lifestyle, preferences } = consultationData;

    // 1. 목표 기반 기본 제품 선택
    const baseProducts = this.getBaseProducts(goal);

    // 2. 생활 패턴 기반 추가 제품
    const lifestyleProducts = this.getLifestyleProducts(goal, lifestyle);

    // 3. 제품 결합 및 중복 제거
    const allProductKeys = [...new Set([...baseProducts, ...lifestyleProducts])];

    // 4. 선호도 필터링 (알레르기 등)
    const filteredProducts = this.filterByPreferences(allProductKeys, preferences);

    // 5. 제품 상세 정보 가져오기
    const products = await this.getProductDetails(filteredProducts);

    // 6. 복용 루틴 생성
    const routine = this.createRoutine(products);

    // 7. 리필 주기 계산
    const refillInfo = this.calculateRefillInfo(products);

    // 8. 추천 이유 생성
    const reasoning = this.generateReasoning(goal, lifestyle, products);

    return {
      products,
      routine,
      refillInfo,
      reasoning,
      goal,
      lifestyle,
      preferences,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 목표 기반 기본 제품
   */
  getBaseProducts(goal) {
    const mapping = {
      'freshness': ['quercetin', 'magnesium'],
      'sleep': ['magnesium'],
      'digestion': ['probiotics'],
      'skin': ['collagen'],
      'exercise': ['bcaa', 'magnesium'],
    };

    return mapping[goal] || [];
  }

  /**
   * 생활 패턴 기반 추가 제품
   */
  getLifestyleProducts(goal, lifestyle) {
    const additionalProducts = [];

    // 카페인 섭취가 많으면 마그네슘 추가
    if (lifestyle.caffeine === '3잔 이상' && goal !== 'sleep') {
      additionalProducts.push('magnesium');
    }

    // 수면 시간이 짧으면 마그네슘 추가
    if (lifestyle.sleep === '5시간 이하') {
      additionalProducts.push('magnesium');
    }

    // 운동을 많이 하면 BCAA 추가
    if (['3~4회', '5회 이상'].includes(lifestyle.exercise) && goal !== 'exercise') {
      additionalProducts.push('bcaa');
    }

    // 운동을 거의 안 하면 퀘르세틴 추가 (순환 개선)
    if (lifestyle.exercise === '거의 안 함' && goal === 'freshness') {
      additionalProducts.push('quercetin');
    }

    return additionalProducts;
  }

  /**
   * 선호도 기반 필터링
   */
  filterByPreferences(productKeys, preferences) {
    // 알레르기 필터링 (현재는 간단한 구현)
    if (preferences.allergies && preferences.allergies.length > 0) {
      // 실제로는 각 제품의 성분을 확인하여 필터링
      // 예: 유당 알레르기면 유제품 포함 제품 제외
    }

    return productKeys;
  }

  /**
   * 제품 상세 정보 가져오기
   */
  async getProductDetails(productKeys) {
    const products = [];

    for (const key of productKeys) {
      const productConfig = this.products[key];
      if (!productConfig) continue;

      // 카페24에서 실시간 정보 가져오기
      let liveData = null;
      if (CONFIG.cafe24.accessToken) {
        const result = await cafe24API.getProduct(productConfig.id);
        if (result.success) {
          liveData = result.data;
        }
      }

      // 재고 정보 가져오기
      let inventory = null;
      if (CONFIG.cafe24.accessToken) {
        const invResult = await cafe24API.getInventory(productConfig.id);
        if (invResult.success) {
          inventory = invResult.data;
        }
      }

      products.push({
        key,
        ...productConfig,
        liveData,
        inventory,
        stock: inventory ? inventory.quantity : null,
        available: inventory ? inventory.quantity > 0 : true,
      });
    }

    return products;
  }

  /**
   * 복용 루틴 생성
   */
  createRoutine(products) {
    const routine = [];

    products.forEach(product => {
      // 제품별 최적 복용 시간 매핑
      const timingMap = {
        'quercetin': { time: '☀️ 아침', period: 'morning', description: '아침 식후' },
        'magnesium': { time: '🌙 저녁', period: 'evening', description: '저녁 식후' },
        'probiotics': { time: '☀️ 아침', period: 'morning', description: '아침 공복' },
        'collagen': { time: '🌙 저녁', period: 'evening', description: '저녁 취침 전' },
        'bcaa': { time: '🏃 운동 전후', period: 'workout', description: '운동 30분 전후' },
      };

      const timing = timingMap[product.key] || { time: '💧 매일', period: 'daily', description: '식후' };

      routine.push({
        time: timing.time,
        period: timing.period,
        product: product.name,
        description: `${timing.description} · ${product.description}`,
        dosage: product.dosagePerDay,
        productKey: product.key,
      });
    });

    // 시간대별 정렬
    const timeOrder = { 'morning': 1, 'workout': 2, 'evening': 3, 'daily': 4 };
    routine.sort((a, b) => (timeOrder[a.period] || 99) - (timeOrder[b.period] || 99));

    return routine;
  }

  /**
   * 리필 주기 계산
   */
  calculateRefillInfo(products) {
    if (products.length === 0) return null;

    // 가장 빨리 소진되는 제품 기준
    const minDays = Math.min(...products.map(p => 
      Utils.calculateRefillDays(p.dosagePerDay, p.packSize)
    ));

    const totalDosagePerDay = products.reduce((sum, p) => sum + p.dosagePerDay, 0);
    
    return {
      days: minDays,
      period: CONFIG.refillPeriods[minDays] || `${minDays}일`,
      totalDosagePerDay,
      notificationDaysBefore: 3,
      nextRefillDate: Utils.formatDate(
        new Date(Date.now() + minDays * 24 * 60 * 60 * 1000)
      ),
    };
  }

  /**
   * 추천 이유 생성
   */
  generateReasoning(goal, lifestyle, products) {
    const reasons = [];

    // 목표 기반 이유
    const goalReasons = {
      'freshness': '상쾌함과 컨디션 향상을 위해',
      'sleep': '수면 질 개선과 피로 회복을 위해',
      'digestion': '장 건강과 소화 기능 개선을 위해',
      'skin': '피부 탄력과 광채 관리를 위해',
      'exercise': '운동 효과 극대화와 회복 지원을 위해',
    };

    reasons.push(goalReasons[goal] || '건강 관리를 위해');

    // 생활 패턴 기반 이유
    if (lifestyle.caffeine === '3잔 이상') {
      reasons.push('카페인 섭취가 많아 마그네슘 소모가 증가할 수 있어요');
    }

    if (lifestyle.sleep === '5시간 이하') {
      reasons.push('수면 시간이 부족하여 회복 지원이 필요해요');
    }

    if (lifestyle.exercise === '거의 안 함') {
      reasons.push('운동량이 적어 순환 개선이 도움될 수 있어요');
    }

    if (['3~4회', '5회 이상'].includes(lifestyle.exercise)) {
      reasons.push('활발한 운동량으로 회복 영양소가 필요해요');
    }

    // 제품별 효능
    const productBenefits = products.map(p => {
      const benefits = {
        'quercetin': '퀘르세틴으로 아침 컨디션을',
        'magnesium': '마그네슘으로 저녁 이완을',
        'probiotics': '프로바이오틱스로 장 건강을',
        'collagen': '콜라겐으로 피부 탄력을',
        'bcaa': 'BCAA로 운동 회복을',
      };
      return benefits[p.key];
    }).filter(Boolean);

    if (productBenefits.length > 0) {
      reasons.push(productBenefits.join(', ') + ' 서포트하는 루틴이에요');
    }

    return reasons.join('. ');
  }

  /**
   * 총 가격 계산
   */
  calculateTotalPrice(products) {
    return products.reduce((sum, p) => sum + p.price, 0);
  }

  /**
   * 대체 제품 추천
   */
  getAlternatives(productKey) {
    const alternatives = {
      'quercetin': ['probiotics'],
      'magnesium': [],
      'probiotics': ['quercetin'],
      'collagen': [],
      'bcaa': ['magnesium'],
    };

    return (alternatives[productKey] || []).map(key => this.products[key]).filter(Boolean);
  }
}

// 전역 인스턴스 생성
const recommendationEngine = new RecommendationEngine();
