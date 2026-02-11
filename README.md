# 바이탈그라피 생기코치 - 대화형 문진 시스템

> 1분 문진으로 고객에게 딱 맞는 건강기능식품 루틴을 추천하는 실용적인 웰니스 코치 앱

## 🎯 주요 기능

### ✨ 핵심 기능
- **대화형 문진 인터페이스**: 5단계 문진으로 고객 니즈 정확히 파악
- **AI 기반 맞춤 추천**: 생활 패턴 분석을 통한 개인화된 루틴 제안
- **실시간 카페24 연동**: 제품 정보, 재고, 가격 실시간 동기화
- **CRM 데이터 전송**: 고객 데이터를 CRM 시스템에 자동 전송
- **리필 알림 시스템**: 소진 예정일 기반 자동 알림
- **PWA 지원**: 앱처럼 설치하여 오프라인에서도 사용 가능

### 📊 개인화 & CRM
- **세션 관리**: 고유 세션 ID로 고객 여정 추적
- **데이터 자동 저장**: 30초마다 자동으로 서버에 동기화
- **마케팅 동의 관리**: 채널별(카카오톡/SMS/이메일) 동의 수집
- **분석 통합**: Google Analytics, 카카오 픽셀, 페이스북 픽셀 지원

### 🛒 전자상거래 통합
- **원클릭 장바구니 추가**: 추천 제품을 바로 장바구니에 추가
- **실시간 재고 확인**: 카페24 API로 재고 상태 실시간 확인
- **자동 회원 연동**: 문진 결과와 함께 회원 정보 자동 생성

## 📁 프로젝트 구조

```
/home/user/webapp/
├── index.html              # 메인 HTML (업그레이드됨)
├── manifest.json           # PWA Manifest
├── sw.js                   # Service Worker
├── css/
│   └── styles.css          # 전체 스타일시트
├── js/
│   ├── config.js           # 설정 파일
│   ├── utils.js            # 유틸리티 함수
│   ├── data-manager.js     # 데이터 관리
│   ├── cafe24-api.js       # 카페24 API 연동
│   ├── recommendation-engine.js  # 추천 엔진
│   └── app.js              # 메인 앱 로직
└── assets/
    └── icons/              # PWA 아이콘
```

## 🚀 빠른 시작

### 1. 설정 파일 수정

`/js/config.js` 파일을 열고 다음 항목을 수정하세요:

```javascript
const CONFIG = {
  cafe24: {
    mallId: 'vitalgraphi',  // 실제 쇼핑몰 ID로 변경
    apiUrl: 'https://vitalgraphi.cafe24api.com/api/v2',
    clientId: 'YOUR_CLIENT_ID',  // 카페24 앱 클라이언트 ID
    clientSecret: 'YOUR_CLIENT_SECRET',
    accessToken: 'YOUR_ACCESS_TOKEN',  // API 액세스 토큰
  },

  backend: {
    apiUrl: 'https://api.vitalgraphi.com',  // 백엔드 API URL
  },

  products: {
    // 제품 코드를 실제 카페24 제품 코드로 변경
    'quercetin': {
      id: 'P0000001',  // 실제 제품 코드
      // ...
    },
  },

  analytics: {
    googleAnalytics: 'G-XXXXXXXXXX',  // GA4 측정 ID
    kakaoPixel: 'XXXXXXXXXX',  // 카카오 픽셀 ID
  },
};
```

### 2. 로컬 테스트

```bash
# 간단한 HTTP 서버 실행
cd /home/user/webapp
python3 -m http.server 8000

# 또는 Node.js 사용
npx serve
```

브라우저에서 `http://localhost:8000` 접속

### 3. 카페24 자사몰 연동

#### 방법 A: 팝업 형태
카페24 관리자 > 디자인 > 스마트 디자인 편집 > HTML 편집:

```html
<!-- 문진 시작 버튼 추가 -->
<button onclick="openWellnessCoach()">
  🌿 나에게 맞는 루틴 찾기
</button>

<script>
function openWellnessCoach() {
  window.open(
    'https://your-domain.com/wellness-coach',
    'wellness-coach',
    'width=420,height=844,scrollbars=no'
  );
}
</script>
```

#### 방법 B: iframe 삽입
```html
<iframe
  src="https://your-domain.com/wellness-coach"
  width="100%"
  height="844px"
  frameborder="0"
  style="max-width: 420px; margin: 0 auto; display: block;"
></iframe>
```

#### 방법 C: 독립 페이지
1. 카페24 관리자 > 쇼핑몰 설정 > 게시판 관리
2. 게시판 추가 > URL 타입 선택
3. 외부 URL에 `https://your-domain.com/wellness-coach` 입력

## 🔧 카페24 API 설정

### 1. 앱 등록
1. [카페24 개발자센터](https://developers.cafe24.com) 접속
2. 내 앱 등록 > 새 앱 만들기
3. 권한 선택:
   - `mall.read_product` (제품 조회)
   - `mall.write_order` (주문 생성)
   - `mall.read_customer` (회원 조회)
   - `mall.write_customer` (회원 생성/수정)

### 2. OAuth 인증
```javascript
// 인증 URL 생성
const authUrl = cafe24API.getOAuthURL(
  'https://your-domain.com/callback',
  'random-state-string'
);

// 사용자를 authUrl로 리다이렉트
window.location.href = authUrl;

// 콜백에서 토큰 교환
const result = await cafe24API.exchangeOAuthToken(code, redirectUri);
if (result.success) {
  console.log('Access Token:', result.data.access_token);
}
```

## 📡 백엔드 API 연동

문진 데이터를 저장하고 CRM과 연동하기 위해 백엔드 API가 필요합니다.

### 필수 엔드포인트

#### 1. 문진 데이터 저장
```
POST /api/consultations
Content-Type: application/json

{
  "sessionId": "uuid",
  "customerId": "customer-id",
  "consultationData": {
    "goal": "freshness",
    "lifestyle": {...},
    "preferences": {...},
    "recommendation": {...}
  }
}
```

#### 2. 고객 정보 저장
```
POST /api/customers
Content-Type: application/json

{
  "sessionId": "uuid",
  "customerData": {
    "email": "customer@example.com",
    "marketingConsent": true,
    "marketingChannel": "kakao"
  }
}
```

#### 3. CRM 데이터 전송
```
POST /api/crm/send
Content-Type: application/json

{
  "sessionId": "uuid",
  "customer": {...},
  "consultation": {...},
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 백엔드 구현 예시 (Node.js + Express)

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// 문진 저장
app.post('/api/consultations', async (req, res) => {
  const { sessionId, customerId, consultationData } = req.body;
  
  // 데이터베이스에 저장
  await db.consultations.insert({
    sessionId,
    customerId,
    data: consultationData,
    createdAt: new Date(),
  });
  
  res.json({ success: true });
});

// 고객 정보 저장
app.post('/api/customers', async (req, res) => {
  const { sessionId, customerData } = req.body;
  
  // 데이터베이스에 저장 또는 업데이트
  await db.customers.upsert({
    sessionId,
    ...customerData,
    updatedAt: new Date(),
  });
  
  res.json({ success: true });
});

// CRM 전송
app.post('/api/crm/send', async (req, res) => {
  const { customer, consultation } = req.body;
  
  // CRM 시스템에 전송 (예: Salesforce, HubSpot)
  await crmClient.createOrUpdateLead({
    email: customer.email,
    source: 'wellness_coach',
    customFields: {
      goal: consultation.goal,
      lifestyle: JSON.stringify(consultation.lifestyle),
    },
  });
  
  res.json({ success: true });
});

app.listen(3000);
```

## 📊 분석 도구 설정

### Google Analytics 4

1. `config.js`에 측정 ID 입력:
```javascript
analytics: {
  googleAnalytics: 'G-XXXXXXXXXX',
}
```

2. `index.html`에서 주석 해제:
```html
<!-- Google Analytics (옵션) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 카카오 픽셀

1. 픽셀 ID 설정
2. `index.html`에서 주석 해제

## 🔔 리필 알림 시스템

### 카카오 알림톡 연동

```javascript
// config.js
notifications: {
  kakao: {
    enabled: true,
    templateId: 'YOUR_TEMPLATE_ID',
  },
}
```

### 백엔드에서 스케줄링

```javascript
const cron = require('node-cron');

// 매일 오전 10시에 리필 알림 체크
cron.schedule('0 10 * * *', async () => {
  const customers = await db.customers.find({
    nextRefillDate: {
      $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3일 이내
    }
  });

  for (const customer of customers) {
    // 카카오 알림톡 발송
    await sendKakaoNotification(customer);
  }
});
```

## 📱 PWA 설치

### 아이콘 준비
`/assets/icons/` 폴더에 다음 크기의 아이콘 추가:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

### HTTPS 필수
PWA는 HTTPS 환경에서만 작동합니다.

### 설치 프롬프트
사용자가 여러 번 방문하면 자동으로 설치 프롬프트가 표시됩니다.

## 🎨 커스터마이징

### 색상 변경
`css/styles.css`에서 주요 색상 변경:

```css
.chat-header {
  background: #111111; /* 브랜드 컬러로 변경 */
}

.cta-primary {
  background: #111111; /* 브랜드 컬러로 변경 */
}
```

### 제품 추가
`js/config.js`의 `products` 객체에 제품 추가:

```javascript
products: {
  'new-product': {
    id: 'P0000006',
    name: '새로운 제품',
    description: '제품 설명',
    price: 40000,
    dosagePerDay: 1,
    packSize: 30,
    category: 'wellness',
  },
}
```

### 추천 로직 수정
`js/recommendation-engine.js`의 `getBaseProducts()` 및 `getLifestyleProducts()` 메서드 수정

## 🧪 테스트

### 로컬 테스트
1. 모든 스크린을 순서대로 테스트
2. 브라우저 개발자 도구 > Console에서 에러 확인
3. 네트워크 탭에서 API 호출 확인

### 모바일 테스트
1. Chrome 개발자 도구 > 디바이스 툴바 활성화
2. iPhone SE, iPhone 12 Pro, Galaxy S20 등 테스트

### 오프라인 테스트
1. 개발자 도구 > Application > Service Workers
2. "Offline" 체크박스 활성화
3. 오프라인 모드에서도 작동하는지 확인

## 🚀 배포

### Netlify / Vercel
```bash
# Netlify
netlify deploy --prod

# Vercel
vercel --prod
```

### 카페24 호스팅
1. FTP로 `/home/user/webapp/` 파일 모두 업로드
2. 카페24 설정에서 도메인 연결

### CDN 최적화
- 이미지를 WebP 포맷으로 변환
- JavaScript를 압축 (Minify)
- Gzip 압축 활성화

## 📈 성과 측정

### 주요 지표
- **완료율**: 문진을 완료한 사용자 비율
- **전환율**: 장바구니 추가 / 회원가입 비율
- **평균 세션 시간**: 사용자가 앱에서 보낸 시간
- **리필 알림 수신율**: 알림을 수신한 고객 비율

### Google Analytics 이벤트
- `session_start`: 세션 시작
- `goal_selected`: 목표 선택
- `consultation_completed`: 문진 완료
- `add_to_cart`: 장바구니 추가
- `marketing_consent`: 마케팅 동의

## 🔒 보안

### 환경 변수
민감한 정보는 환경 변수로 관리:

```html
<!-- index.html -->
<script>
  window.ENV_CONFIG = {
    cafe24: {
      clientId: '<%= ENV['CAFE24_CLIENT_ID'] %>',
      clientSecret: '<%= ENV['CAFE24_CLIENT_SECRET'] %>',
    }
  };
</script>
```

### CORS 설정
백엔드 API에서 CORS 헤더 설정:

```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://vitalgraphi.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
```

## 🐛 문제 해결

### Service Worker가 등록되지 않음
- HTTPS 환경인지 확인
- `sw.js` 파일 경로 확인
- 브라우저 캐시 클리어

### 카페24 API 호출 실패
- Access Token이 유효한지 확인
- API 권한이 올바른지 확인
- CORS 설정 확인

### 데이터가 저장되지 않음
- LocalStorage가 활성화되어 있는지 확인
- 백엔드 API 엔드포인트 확인
- 네트워크 연결 상태 확인

## 📞 지원

문의사항이나 버그 리포트:
- 이메일: support@vitalgraphi.com
- GitHub Issues: (저장소 링크)

## 📄 라이선스

Proprietary - 바이탈그라피 전용

---

**바이탈그라피 생기코치** - 고객의 건강을 위한 첫걸음 🌿
