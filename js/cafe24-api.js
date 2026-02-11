/**
 * ═══════════════════════════════════════════════════════
 * 바이탈그라피 생기코치 - 카페24 API 연동
 * ═══════════════════════════════════════════════════════
 */

class Cafe24API {
  constructor() {
    this.config = CONFIG.cafe24;
    this.cache = {
      products: null,
      inventory: null,
      lastUpdate: null,
    };
  }

  /**
   * API 요청 헤더 생성
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.accessToken}`,
      'X-Cafe24-Api-Version': '2024-03-01',
    };
  }

  /**
   * 제품 정보 가져오기
   */
  async getProduct(productId) {
    try {
      // API 토큰이 없으면 로컬 데이터 반환
      if (!this.config.accessToken || this.config.accessToken === '') {
        if (CONFIG.settings.debugMode) {
          console.warn('Cafe24 API not configured, using local product data');
        }
        return this.getLocalProduct(productId);
      }

      // 캐시 확인
      if (this.cache.products && this.cache.products[productId]) {
        const cacheAge = Date.now() - this.cache.lastUpdate;
        if (cacheAge < 300000) { // 5분 캐시
          return { success: true, data: this.cache.products[productId] };
        }
      }

      const url = `${this.config.apiUrl}/admin/products/${productId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 캐시 업데이트
      if (!this.cache.products) this.cache.products = {};
      this.cache.products[productId] = data.product;
      this.cache.lastUpdate = Date.now();

      return { success: true, data: data.product };
    } catch (error) {
      if (CONFIG.settings.debugMode) {
        console.warn('Cafe24 API error, falling back to local data:', error);
      }
      return this.getLocalProduct(productId);
    }
  }

  /**
   * 로컬 제품 데이터 반환 (API 연동 전)
   */
  getLocalProduct(productId) {
    // CONFIG.products에서 productId로 검색
    for (const [key, product] of Object.entries(CONFIG.products)) {
      if (product.id === productId) {
        return { 
          success: true, 
          data: {
            ...product,
            stock: 999, // 기본 재고
            available: true
          }
        };
      }
    }
    return { success: false, error: 'Product not found' };
  }

  /**
   * 여러 제품 정보 가져오기
   */
  async getProducts(productIds) {
    const results = await Promise.all(
      productIds.map(id => this.getProduct(id))
    );

    const products = results
      .filter(r => r.success)
      .map(r => r.data);

    return { success: true, data: products };
  }

  /**
   * 재고 정보 가져오기
   */
  async getInventory(productId) {
    try {
      // 캐시 확인
      if (this.cache.inventory && this.cache.inventory[productId]) {
        const cacheAge = Date.now() - this.cache.lastUpdate;
        if (cacheAge < 60000) { // 1분 캐시
          return { success: true, data: this.cache.inventory[productId] };
        }
      }

      const url = `${this.config.apiUrl}/admin/products/${productId}/inventory`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 캐시 업데이트
      if (!this.cache.inventory) this.cache.inventory = {};
      this.cache.inventory[productId] = data.inventory;
      this.cache.lastUpdate = Date.now();

      return { success: true, data: data.inventory };
    } catch (error) {
      console.error('Cafe24 API - Get Inventory Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 장바구니에 제품 추가
   */
  async addToCart(items) {
    try {
      const url = `${this.config.apiUrl}/api/v2/carts`;
      
      const payload = {
        shop_no: 1,
        items: items.map(item => ({
          product_no: item.productId,
          quantity: item.quantity || 1,
          options: item.options || [],
        })),
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: data.cart };
    } catch (error) {
      console.error('Cafe24 API - Add to Cart Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 회원 정보 생성/업데이트
   */
  async createOrUpdateCustomer(customerData) {
    try {
      const url = `${this.config.apiUrl}/admin/customers`;
      
      const payload = {
        shop_no: 1,
        member_id: customerData.email,
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        additional_information: {
          wellness_goal: customerData.goal,
          consultation_data: JSON.stringify(customerData.consultation),
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: data.customer };
    } catch (error) {
      console.error('Cafe24 API - Create Customer Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 주문 생성
   */
  async createOrder(orderData) {
    try {
      const url = `${this.config.apiUrl}/admin/orders`;
      
      const payload = {
        shop_no: 1,
        member_id: orderData.customerId,
        items: orderData.items.map(item => ({
          product_no: item.productId,
          quantity: item.quantity,
          product_price: item.price,
        })),
        shipping: orderData.shipping,
        payment: orderData.payment,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: data.order };
    } catch (error) {
      console.error('Cafe24 API - Create Order Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 카페24 OAuth 인증 URL 생성
   */
  getOAuthURL(redirectUri, state) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      state: state,
      redirect_uri: redirectUri,
      scope: 'mall.read_product,mall.write_order,mall.read_customer,mall.write_customer',
    });

    return `https://${this.config.mallId}.cafe24api.com/api/v2/oauth/authorize?${params.toString()}`;
  }

  /**
   * OAuth 토큰 교환
   */
  async exchangeOAuthToken(code, redirectUri) {
    try {
      const url = `https://${this.config.mallId}.cafe24api.com/api/v2/oauth/token`;
      
      const payload = {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 토큰 저장
      this.config.accessToken = data.access_token;
      Utils.saveToStorage('cafe24_access_token', data.access_token);
      Utils.saveToStorage('cafe24_refresh_token', data.refresh_token);

      return { success: true, data };
    } catch (error) {
      console.error('Cafe24 API - Token Exchange Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 캐시 클리어
   */
  clearCache() {
    this.cache = {
      products: null,
      inventory: null,
      lastUpdate: null,
    };
  }
}

// 전역 인스턴스 생성
const cafe24API = new Cafe24API();
