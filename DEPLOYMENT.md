# 🚀 배포 가이드

## 📋 체크리스트

배포 전 다음 항목을 확인하세요:

- [ ] 카페24 API 설정 완료 (Client ID, Secret, Access Token)
- [ ] 백엔드 API 엔드포인트 설정
- [ ] 제품 코드 매핑 (실제 카페24 제품 코드로)
- [ ] Google Analytics ID 설정 (선택)
- [ ] 카카오 픽셀 ID 설정 (선택)
- [ ] PWA 아이콘 준비 (72x72 ~ 512x512)
- [ ] HTTPS 인증서 설정

## 🎯 배포 옵션

### 옵션 1: Netlify (권장)

가장 빠르고 쉬운 방법입니다.

#### 1-1. GitHub 연동
```bash
# Git 저장소 초기화 (아직 안 했다면)
cd /home/user/webapp
git init
git add .
git commit -m "Initial commit: 바이탈그라피 생기코치"

# GitHub에 푸시
git remote add origin https://github.com/your-username/vitalgraphi-coach.git
git push -u origin main
```

#### 1-2. Netlify 배포
1. [Netlify](https://netlify.com) 접속
2. "New site from Git" 클릭
3. GitHub 저장소 선택
4. Build settings:
   - Build command: (비워두기)
   - Publish directory: `.`
5. "Deploy site" 클릭

#### 1-3. 환경 변수 설정
Netlify > Site settings > Environment variables:
```
CAFE24_CLIENT_ID=your_client_id
CAFE24_CLIENT_SECRET=your_client_secret
CAFE24_ACCESS_TOKEN=your_access_token
BACKEND_API_URL=https://api.vitalgraphi.com
```

#### 1-4. 커스텀 도메인 연결
1. Netlify > Domain settings
2. "Add custom domain" 클릭
3. DNS 설정:
   ```
   Type: CNAME
   Name: coach (또는 wellness)
   Value: your-site.netlify.app
   ```

### 옵션 2: Vercel

#### 2-1. Vercel CLI 설치
```bash
npm i -g vercel
```

#### 2-2. 배포
```bash
cd /home/user/webapp
vercel

# 프로덕션 배포
vercel --prod
```

#### 2-3. 환경 변수 설정
```bash
vercel env add CAFE24_CLIENT_ID
vercel env add CAFE24_CLIENT_SECRET
vercel env add CAFE24_ACCESS_TOKEN
```

### 옵션 3: 카페24 직접 호스팅

#### 3-1. FTP 설정
카페24 관리자 > 쇼핑몰 관리 > FTP 관리에서 FTP 계정 생성

#### 3-2. 파일 업로드
```bash
# FTP 클라이언트 (예: FileZilla) 사용
호스트: ftp.cafe24.com
사용자명: your_ftp_username
비밀번호: your_ftp_password
포트: 21

# 업로드할 디렉토리
/www/wellness-coach/
```

#### 3-3. 카페24에서 접근 설정
카페24 관리자 > 디자인 > 스마트 디자인 편집:

```html
<!-- 헤더에 링크 추가 -->
<a href="/wellness-coach/">
  🌿 나에게 맞는 루틴 찾기
</a>
```

### 옵션 4: AWS S3 + CloudFront

#### 4-1. S3 버킷 생성
```bash
aws s3 mb s3://vitalgraphi-coach
```

#### 4-2. 파일 업로드
```bash
cd /home/user/webapp
aws s3 sync . s3://vitalgraphi-coach \
  --exclude ".git/*" \
  --exclude "*.md" \
  --exclude "index_backup.html"
```

#### 4-3. 버킷 정책 설정
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::vitalgraphi-coach/*"
    }
  ]
}
```

#### 4-4. CloudFront 배포
1. AWS CloudFront 콘솔 접속
2. Create Distribution
3. Origin Domain: s3://vitalgraphi-coach
4. Viewer Protocol Policy: Redirect HTTP to HTTPS
5. SSL Certificate: Custom SSL certificate

## 🔧 카페24 자사몰 연동

### 방법 1: 팝업 형태

카페24 디자인 편집에서 아래 코드 추가:

```html
<!-- 스타일 -->
<style>
.wellness-coach-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #111;
  color: #fff;
  padding: 15px 25px;
  border-radius: 50px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
}

.wellness-coach-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 30px rgba(0,0,0,0.4);
}

@media (max-width: 768px) {
  .wellness-coach-btn {
    bottom: 80px;
    right: 15px;
    font-size: 14px;
    padding: 12px 20px;
  }
}
</style>

<!-- 버튼 -->
<button class="wellness-coach-btn" onclick="openWellnessCoach()">
  <span>🌿</span>
  <span>나에게 맞는 루틴 찾기</span>
</button>

<!-- 스크립트 -->
<script>
function openWellnessCoach() {
  // 모바일 감지
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // 모바일: 새 탭으로 열기
    window.open('https://coach.vitalgraphi.com', '_blank');
  } else {
    // 데스크톱: 팝업
    window.open(
      'https://coach.vitalgraphi.com',
      'wellness-coach',
      'width=420,height=844,scrollbars=no,resizable=no'
    );
  }
}

// 페이지 로드 시 자동 표시 (선택사항)
window.addEventListener('load', function() {
  setTimeout(function() {
    document.querySelector('.wellness-coach-btn').style.animation = 'pulse 2s infinite';
  }, 3000);
});
</script>

<style>
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
</style>
```

### 방법 2: 메인 페이지 배너

```html
<!-- 메인 페이지 상단 배너 -->
<div class="wellness-banner" onclick="window.location.href='https://coach.vitalgraphi.com'">
  <div class="banner-content">
    <div class="banner-icon">🌿</div>
    <div class="banner-text">
      <h3>나에게 딱 맞는 웰니스 루틴을 찾아보세요</h3>
      <p>1분 문진으로 맞춤 추천받기</p>
    </div>
    <div class="banner-cta">시작하기 →</div>
  </div>
</div>

<style>
.wellness-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px 20px;
  margin: 20px 0;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.3s;
}

.wellness-banner:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  color: #fff;
}

.banner-icon {
  font-size: 48px;
}

.banner-text {
  flex: 1;
}

.banner-text h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.banner-text p {
  margin: 5px 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.banner-cta {
  background: #fff;
  color: #764ba2;
  padding: 12px 24px;
  border-radius: 24px;
  font-weight: 700;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .banner-content {
    flex-direction: column;
    text-align: center;
  }
  
  .banner-icon {
    font-size: 36px;
  }
}
</style>
```

### 방법 3: 제품 상세 페이지

```html
<!-- 제품 상세 페이지에 추가 -->
<div class="product-wellness-section">
  <h3>🌿 이 제품이 나에게 맞을까요?</h3>
  <p>1분 문진으로 내 건강 상태에 맞는 제품을 추천받아보세요</p>
  <button onclick="openWellnessCoach()">무료 문진 시작하기</button>
</div>
```

## 📊 GA4 설정

### 1. Google Analytics 계정 생성
1. [Google Analytics](https://analytics.google.com) 접속
2. 관리 > 속성 만들기
3. 속성 이름: "바이탈그라피 생기코치"
4. 측정 ID 복사 (G-XXXXXXXXXX)

### 2. config.js 업데이트
```javascript
analytics: {
  googleAnalytics: 'G-XXXXXXXXXX',  // 실제 측정 ID
}
```

### 3. 맞춤 이벤트 확인
다음 이벤트가 자동으로 전송됩니다:
- `session_start`: 세션 시작
- `goal_selected`: 목표 선택
- `lifestyle_updated`: 생활 패턴 입력
- `preference_updated`: 선호도 입력
- `consultation_completed`: 문진 완료
- `add_to_cart`: 장바구니 추가
- `marketing_consent`: 마케팅 동의

### 4. GA4 대시보드 설정
1. 보고서 > 맞춤 보고서 만들기
2. 다음 측정기준 추가:
   - 이벤트 이름
   - 세션 ID
   - 목표 (goal)
   - 제품명

## 🔔 카카오 알림톡 설정

### 1. 카카오 비즈니스 채널 생성
1. [카카오 비즈니스](https://business.kakao.com) 접속
2. 채널 추가하기
3. 프로필 이미지, 설명 설정

### 2. 알림톡 템플릿 등록
카카오 비즈니스 > 메시지 > 알림톡 템플릿:

```
템플릿명: 리필 알림
템플릿 코드: REFILL_REMINDER

내용:
#{고객명}님, 안녕하세요! 🌿

구독 중인 건강기능식품이 
#{소진일}에 소진 예정이에요.

지금 재구매하시면 끊김 없이 
건강 루틴을 이어갈 수 있어요!

[재구매하기]
#{재구매_링크}

※ 알림 수신을 원하지 않으시면 
   마이페이지에서 설정을 변경해주세요.
```

### 3. 백엔드에서 발송
```javascript
const axios = require('axios');

async function sendRefillNotification(customer) {
  const response = await axios.post(
    'https://api.kakao.com/v2/api/send',
    {
      template_code: 'REFILL_REMINDER',
      phone_number: customer.phone,
      template_params: {
        고객명: customer.name,
        소진일: customer.refillDate,
        재구매_링크: `https://vitalgraphi.com/repurchase?id=${customer.id}`,
      },
    },
    {
      headers: {
        'Authorization': `Bearer ${KAKAO_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  return response.data;
}
```

## 🔒 보안 체크리스트

### 환경 변수 관리
민감한 정보는 절대 Git에 커밋하지 마세요!

`.env` 파일 생성:
```bash
# .env
CAFE24_CLIENT_ID=your_client_id
CAFE24_CLIENT_SECRET=your_client_secret
CAFE24_ACCESS_TOKEN=your_access_token
BACKEND_API_URL=https://api.vitalgraphi.com
GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

`.gitignore` 추가:
```
.env
*.env.local
*.env.production
config.production.js
```

### HTTPS 필수
- Let's Encrypt 무료 SSL 인증서 사용
- Netlify/Vercel은 자동으로 HTTPS 제공

### CORS 설정
백엔드 API에서:
```javascript
app.use(cors({
  origin: ['https://vitalgraphi.com', 'https://coach.vitalgraphi.com'],
  methods: ['GET', 'POST'],
  credentials: true,
}));
```

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; 
               style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;">
```

## 📱 모바일 최적화

### 1. 메타 태그 확인
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

### 2. PWA 설치 프롬프트
```javascript
// 설치 프롬프트 표시
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // 커스텀 설치 버튼 표시
  showInstallButton();
});

function showInstallButton() {
  const installBtn = document.createElement('button');
  installBtn.textContent = '앱으로 설치하기';
  installBtn.onclick = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);
    deferredPrompt = null;
  };
  document.body.appendChild(installBtn);
}
```

## 🧪 테스트 체크리스트

### 기능 테스트
- [ ] 모든 스크린 정상 작동
- [ ] 선택 항목이 올바르게 저장됨
- [ ] 추천 결과가 정확하게 표시됨
- [ ] 장바구니 추가 작동
- [ ] 모달이 올바르게 열리고 닫힘

### 브라우저 테스트
- [ ] Chrome (Desktop & Mobile)
- [ ] Safari (Desktop & Mobile)
- [ ] Firefox
- [ ] Edge

### 디바이스 테스트
- [ ] iPhone SE (375x667)
- [ ] iPhone 12 Pro (390x844)
- [ ] iPad (768x1024)
- [ ] Galaxy S21 (360x800)

### 성능 테스트
Lighthouse 점수 목표:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

```bash
# Lighthouse 실행
npx lighthouse https://coach.vitalgraphi.com --view
```

## 📈 모니터링

### 1. Sentry (에러 추적)
```bash
npm install @sentry/browser
```

```javascript
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
});
```

### 2. Google Search Console
1. [Search Console](https://search.google.com/search-console) 접속
2. 속성 추가
3. HTML 태그로 소유권 확인
4. Sitemap 제출

### 3. 업타임 모니터링
- [UptimeRobot](https://uptimerobot.com) (무료)
- 5분마다 사이트 상태 체크
- 다운 시 이메일 알림

## 🚨 장애 대응

### 롤백 프로세스
```bash
# 이전 버전으로 롤백
netlify rollback

# 또는 Git으로 롤백
git revert HEAD
git push origin main
```

### 긴급 패치
1. 핫픽스 브랜치 생성
2. 수정 후 즉시 배포
3. main 브랜치에 병합

## 📞 배포 후 지원

### 고객 지원 준비
- 자주 묻는 질문 (FAQ) 페이지 작성
- 고객센터 연락처 명시
- 실시간 채팅 위젯 추가 (예: 채널톡)

### 팀 교육
- 운영팀에 관리자 매뉴얼 전달
- 고객 문의 대응 프로세스 정리
- 정기적인 데이터 리뷰 미팅

---

**축하합니다! 🎉**
배포가 완료되었습니다. 이제 고객들이 바이탈그라피 생기코치를 사용할 수 있습니다.
