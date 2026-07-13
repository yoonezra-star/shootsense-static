import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { SITE_NAME, SITE_URL } from "./lib/site-config.mjs";

const rootDir = process.cwd();
const today = "2026-07-13";
const skipSegments = new Set(["node_modules", ".git", "feed", "comments", "wp-json"]);

const trustCss = `
/* ss-trust-signals:start */
.ss-trust-box{margin:18px 0 18px;padding:18px 20px;border:1px solid #dbe5f0;border-radius:8px;background:#f8fbff;color:#213044;box-shadow:0 8px 22px rgba(15,23,42,.04);}
.ss-trust-kicker{display:inline-block;margin:0 0 8px;padding:3px 9px;border-radius:999px;background:#e5f1fb;color:#0f5b99;font-size:11.5px;font-weight:900;letter-spacing:.06em;}
.ss-trust-box h2{margin:0 0 10px;font-size:20px;line-height:1.35;color:#10213a;}
.ss-trust-box ul{margin:0 0 10px 18px;padding:0;}
.ss-trust-box li{margin:5px 0;line-height:1.65;}
.ss-trust-note{margin:12px 0 0;padding-top:10px;border-top:1px solid #dbe5f0;color:#516174;font-size:13.5px;line-height:1.6;}
.ss-trust-note a{font-weight:800;color:#0f5b99;text-decoration:underline;text-underline-offset:3px;}
.ss-page-hero{margin:0 0 28px;padding:30px 28px;border:1px solid #dbe5f0;border-radius:8px;background:linear-gradient(135deg,#f8fbff 0%,#fff 62%,#eef6ff 100%);}
.ss-page-kicker{margin:0 0 9px;color:#0f5b99;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;}
.ss-page-lead{margin:10px 0 0;color:#334155;font-size:18px;line-height:1.75;}
.ss-page-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:16px 0 24px;}
.ss-page-card{padding:18px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;}
.ss-page-card h3{margin:0 0 8px;font-size:17px;color:#10213a;}
.ss-page-card p,.ss-page-card li{color:#475569;line-height:1.65;}
.ss-contact-email{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin:16px 0 24px;padding:18px 20px;border:1px solid #bfdbfe;border-radius:8px;background:#eff6ff;}
.ss-contact-email strong{display:block;margin-bottom:4px;color:#10213a;font-size:17px;}
.ss-contact-email span{display:block;color:#475569;line-height:1.6;}
.ss-contact-email a{display:inline-flex;align-items:center;min-height:42px;padding:0 14px;border-radius:8px;background:#0f5b99;color:#fff !important;text-decoration:none !important;font-weight:900;}
.ss-page-table{width:100%;border-collapse:separate;border-spacing:0;margin:12px 0 24px;border:1px solid #dbe5f0;border-radius:8px;overflow:hidden;background:#fff;}
.ss-page-table th,.ss-page-table td{padding:12px 14px;border-bottom:1px solid #e6edf5;text-align:left;vertical-align:top;line-height:1.65;}
.ss-page-table tr:last-child th,.ss-page-table tr:last-child td{border-bottom:0;}
.ss-page-table th{width:28%;background:#f3f7fb;color:#10213a;font-weight:900;}
.ss-page-callout{margin:18px 0 24px;padding:18px 20px;border-left:4px solid #0f5b99;background:#f8fafc;color:#334155;line-height:1.75;}
.ss-page-list{margin:8px 0 20px 20px;padding:0;}
.ss-page-list li{margin:6px 0;line-height:1.7;}
@media (max-width:720px){
  .ss-page-hero{padding:22px 18px;}
  .ss-page-grid{grid-template-columns:1fr;}
  .ss-page-table,.ss-page-table tbody,.ss-page-table tr,.ss-page-table th,.ss-page-table td{display:block;width:100%;}
  .ss-page-table th{border-bottom:0;}
  .ss-page-table td{padding-top:0;}
}
/* ss-trust-signals:end */
`;

const pages = new Map([
  [
    "about/index.html",
    {
      title: "사이트 소개 - 여행정보엑스퍼트",
      description:
        "여행정보엑스퍼트는 혼자 여행자가 숙소, 이동, 식사, 야간 도착, 안전 판단을 스스로 결정할 수 있도록 검수 기준과 실전 체크리스트를 제공하는 여행 정보 사이트입니다.",
      body: `
<div class="ss-page">
  <section class="ss-page-hero">
    <p class="ss-page-kicker">About Shootsense</p>
    <h1>혼자 여행자를 위한 판단 중심 여행 정보</h1>
    <p class="ss-page-lead">여행정보엑스퍼트는 관광지 나열보다 실제 결정에 필요한 기준을 먼저 정리합니다. 숙소를 어디에 잡아야 하는지, 밤에 도착해도 되는지, 혼밥과 이동은 어느 정도 난이도인지처럼 혼자 여행자가 출발 전에 확인해야 할 질문을 글의 중심에 둡니다.</p>
  </section>
  <h2>사이트 운영 목적</h2>
  <p>이 사이트의 목적은 독자가 특정 여행지를 무작정 따라가게 만드는 것이 아니라, 자신의 일정과 예산, 체력, 안전 기준에 맞춰 선택할 수 있도록 돕는 것입니다. 그래서 글에는 추천만 적지 않고 피해야 할 조건, 예외 상황, 현장에서 다시 확인해야 하는 정보도 함께 넣습니다.</p>
  <div class="ss-page-grid">
    <div class="ss-page-card"><h3>숙소 판단</h3><p>역과 정류장 거리, 밤길 동선, 체크인 시간, 주변 편의시설처럼 혼자 이동할 때 체감 차이가 큰 기준을 따집니다.</p></div>
    <div class="ss-page-card"><h3>이동 판단</h3><p>도착 시간, 환승 난이도, 짐이 있을 때의 피로도, 택시나 대중교통 대안까지 함께 봅니다.</p></div>
    <div class="ss-page-card"><h3>식사 판단</h3><p>혼자 들어가기 쉬운 식당 형태, 주문 난이도, 늦은 시간 선택지를 분리해서 설명합니다.</p></div>
    <div class="ss-page-card"><h3>안전 판단</h3><p>과장된 공포보다 실제로 조심해야 할 시간대, 장소, 행동 기준을 정리합니다.</p></div>
  </div>
  <h2>콘텐츠 작성 기준</h2>
  <table class="ss-page-table">
    <tbody>
      <tr><th>정보 수집</th><td>여행 경험, 공식 안내, 지도 정보, 교통 정보, 숙소와 식당 후기에서 반복적으로 확인되는 내용을 교차 확인합니다.</td></tr>
      <tr><th>검토 방식</th><td>혼자 여행자가 실제로 내릴 결정으로 바꾸어 숙소, 이동, 식사, 야간 도착, 예산, 체력 부담을 점검합니다.</td></tr>
      <tr><th>표현 원칙</th><td>확정할 수 없는 정보는 단정하지 않고, 바뀔 수 있는 요금과 영업시간은 현장 확인이 필요하다고 표시합니다.</td></tr>
      <tr><th>수정 기준</th><td>오류 제보나 최신 정보가 확인되면 본문을 다시 검토하고 필요한 경우 제목, 요약, 체크리스트까지 함께 수정합니다.</td></tr>
    </tbody>
  </table>
  <h2>독자에게 하는 약속</h2>
  <ul class="ss-page-list">
    <li>광고나 제휴 가능성이 있는 내용은 독자가 오해하지 않도록 본문과 정책 페이지에서 분리해 안내합니다.</li>
    <li>특정 지역을 과도하게 미화하거나 불필요하게 위험하게 묘사하지 않습니다.</li>
    <li>짧은 감상문보다 독자가 바로 확인하고 판단할 수 있는 실용 정보를 우선합니다.</li>
    <li>문의와 오류 제보는 <a href="/contact/">문의하기</a> 페이지의 기준에 따라 검토합니다.</li>
  </ul>
  <p class="ss-page-callout">여행정보엑스퍼트는 혼자 여행의 불안을 없애겠다고 약속하지 않습니다. 대신 독자가 어떤 불안을 미리 확인해야 하는지, 어떤 조건이면 일정을 바꾸는 편이 나은지 판단할 수 있도록 돕습니다.</p>
</div>`
    }
  ],
  [
    "contact/index.html",
    {
      title: "문의하기 - 여행정보엑스퍼트",
      description:
        "여행정보엑스퍼트 공식 문의 페이지입니다. contact@shootsense.com으로 콘텐츠 오류 제보, 수정 요청, 광고와 제휴 문의, 개인정보 관련 요청을 보낼 수 있습니다.",
      body: `
<div class="ss-page">
  <section class="ss-page-hero">
    <p class="ss-page-kicker">Contact</p>
    <h1>문의하기</h1>
    <p class="ss-page-lead">여행정보엑스퍼트는 여행 정보의 정확성과 독자 신뢰를 중요하게 봅니다. 본문 오류, 최신 정보 반영 요청, 권리 침해 우려, 광고와 제휴 문의는 아래 기준에 따라 검토합니다.</p>
  </section>
  <div class="ss-contact-email">
    <div>
      <strong>공식 문의 이메일</strong>
      <span>콘텐츠 오류 제보, 수정 요청, 광고·제휴 문의, 개인정보 관련 요청은 이 주소로 보내주세요.</span>
    </div>
    <a href="mailto:contact@shootsense.com">contact@shootsense.com</a>
  </div>
  <h2>접수 가능한 문의</h2>
  <div class="ss-page-grid">
    <div class="ss-page-card"><h3>콘텐츠 오류 제보</h3><p>교통편, 요금, 영업시간, 위치 설명, 안전 관련 표현이 실제와 다르거나 오래된 경우 알려주세요.</p></div>
    <div class="ss-page-card"><h3>수정 및 보강 요청</h3><p>혼자 여행자에게 필요한 정보가 빠졌거나 설명이 부족한 글은 근거를 확인한 뒤 보강합니다.</p></div>
    <div class="ss-page-card"><h3>광고 및 제휴 문의</h3><p>광고성 콘텐츠는 독자가 식별할 수 있어야 하며, 편집 기준과 맞지 않는 제안은 진행하지 않습니다.</p></div>
    <div class="ss-page-card"><h3>개인정보 관련 요청</h3><p>개인정보 처리, 쿠키, 광고 식별자와 관련된 요청은 <a href="/privacy-policy/">개인정보처리방침</a> 기준에 따라 확인합니다.</p></div>
  </div>
  <h2>문의 처리 기준</h2>
  <table class="ss-page-table">
    <tbody>
      <tr><th>오류 제보</th><td>제보 내용이 공식 자료, 지도 정보, 현지 운영 정보 등으로 확인되면 관련 문장을 수정합니다.</td></tr>
      <tr><th>광고 문의</th><td>독립적인 편집 판단을 해치거나 독자를 오해하게 하는 표현은 게재하지 않습니다.</td></tr>
      <tr><th>권리 침해</th><td>이미지, 인용, 명칭 사용과 관련된 문제가 확인되면 우선 노출 범위를 줄이고 사실관계를 검토합니다.</td></tr>
      <tr><th>응답 원칙</th><td>문의 내용의 성격에 따라 확인 시간이 달라질 수 있으며, 긴급 안전 정보는 우선 검토 대상으로 분류합니다.</td></tr>
    </tbody>
  </table>
  <h2>정확한 제보를 위해 필요한 내용</h2>
  <ul class="ss-page-list">
    <li>문제가 있는 글 주소 또는 제목</li>
    <li>수정이 필요한 문장이나 항목</li>
    <li>확인 가능한 공식 안내, 현장 사진, 지도 정보, 운영 공지 등 근거 자료</li>
    <li>광고와 제휴 문의의 경우 상품, 지역, 노출 방식, 독자에게 제공되는 실제 가치</li>
  </ul>
  <p class="ss-page-callout">이 페이지와 contact@shootsense.com은 여행정보엑스퍼트의 공식 문의 창구입니다. 오류 제보는 근거 자료와 함께 보내주시면 더 빠르게 확인할 수 있으며, 광고와 제휴 제안은 편집 독립성을 해치지 않는 경우에만 검토합니다.</p>
</div>`
    }
  ],
  [
    "editorial-policy/index.html",
    {
      title: "편집 정책 - 여행정보엑스퍼트",
      description:
        "여행정보엑스퍼트의 콘텐츠 검수, 수정, 광고 고지, 독립성 기준을 안내하는 편집 정책 페이지입니다.",
      body: `
<div class="ss-page">
  <section class="ss-page-hero">
    <p class="ss-page-kicker">Editorial Policy</p>
    <h1>편집 정책</h1>
    <p class="ss-page-lead">여행정보엑스퍼트의 글은 혼자 여행자가 실제 결정을 내릴 때 필요한 정보를 기준으로 작성합니다. 감상, 추천, 광고성 표현보다 검증 가능한 기준과 독자의 안전한 판단을 우선합니다.</p>
  </section>
  <h2>콘텐츠 검수 절차</h2>
  <table class="ss-page-table">
    <tbody>
      <tr><th>1차 구성</th><td>글 주제를 숙소, 이동, 식사, 안전, 예산, 시간대처럼 독자의 실제 결정 단위로 나눕니다.</td></tr>
      <tr><th>2차 확인</th><td>공식 안내, 지도 정보, 교통 정보, 숙소와 식당 후기에서 반복되는 내용을 비교합니다.</td></tr>
      <tr><th>3차 편집</th><td>추천 사유뿐 아니라 피해야 할 조건, 예외 상황, 현장 확인이 필요한 정보를 함께 적습니다.</td></tr>
      <tr><th>발행 후 점검</th><td>오류 제보, 정책 변경, 교통 변경, 계절성 이슈가 확인되면 본문을 다시 검토합니다.</td></tr>
    </tbody>
  </table>
  <h2>표현 원칙</h2>
  <ul class="ss-page-list">
    <li>확인되지 않은 가격, 운영시간, 안전 정보를 확정 표현으로 쓰지 않습니다.</li>
    <li>모든 여행자에게 안전하거나 좋다고 단정하지 않고, 조건과 한계를 함께 설명합니다.</li>
    <li>광고성 표현과 편집 의견이 섞이지 않도록 문맥을 분리합니다.</li>
    <li>혼자 여행자에게 직접 도움이 되지 않는 반복 문장과 얕은 감상은 줄입니다.</li>
  </ul>
  <h2>광고와 제휴 고지</h2>
  <p>사이트 운영 과정에서 광고, 제휴 링크, 협찬 제안이 포함될 수 있습니다. 다만 광고나 제휴 여부가 글의 핵심 판단 기준을 바꾸어서는 안 되며, 독자가 광고성 요소를 식별할 수 있도록 필요한 경우 본문 또는 정책 페이지에서 안내합니다.</p>
  <h2>수정과 정정</h2>
  <p>잘못된 정보가 확인되면 가능한 한 빠르게 수정합니다. 단순 오탈자와 표현 정리는 별도 고지 없이 반영할 수 있으며, 여행 판단에 영향을 주는 중요한 오류는 본문 구조와 체크리스트까지 다시 점검합니다.</p>
  <p class="ss-page-callout">편집 정책의 핵심은 “많아 보이는 글”이 아니라 “결정에 도움이 되는 글”입니다. 애매한 정보는 애매하다고 표시하고, 확실한 기준은 독자가 바로 사용할 수 있게 정리합니다.</p>
</div>`
    }
  ],
  [
    "privacy-policy/index.html",
    {
      title: "개인정보처리방침 - 여행정보엑스퍼트",
      description:
        "여행정보엑스퍼트의 개인정보 처리, 쿠키, 광고 식별자, 외부 서비스 이용 기준을 안내합니다.",
      body: `
<div class="ss-page">
  <section class="ss-page-hero">
    <p class="ss-page-kicker">Privacy Policy</p>
    <h1>개인정보처리방침</h1>
    <p class="ss-page-lead">여행정보엑스퍼트는 독자의 개인정보를 불필요하게 요구하지 않습니다. 사이트 이용 과정에서 발생할 수 있는 쿠키, 로그, 광고 식별자, 외부 서비스 연결 정보를 아래 기준에 따라 안내합니다.</p>
  </section>
  <h2>수집될 수 있는 정보</h2>
  <table class="ss-page-table">
    <tbody>
      <tr><th>접속 로그</th><td>방문 시간, 브라우저, 기기, 참조 주소처럼 사이트 운영과 보안 확인에 필요한 기술 정보가 서버 또는 분석 도구에 기록될 수 있습니다.</td></tr>
      <tr><th>쿠키</th><td>광고 표시, 방문 통계, 사용자 환경 개선을 위해 쿠키가 사용될 수 있으며 브라우저 설정에서 제한할 수 있습니다.</td></tr>
      <tr><th>문의 정보</th><td>독자가 오류 제보나 권리 요청을 보낼 경우, 답변과 사실 확인에 필요한 범위에서 제공 정보가 사용될 수 있습니다.</td></tr>
      <tr><th>광고 식별자</th><td>Google AdSense 등 광고 서비스가 맞춤 광고와 부정 사용 방지를 위해 쿠키나 식별자를 사용할 수 있습니다.</td></tr>
    </tbody>
  </table>
  <h2>이용 목적</h2>
  <ul class="ss-page-list">
    <li>사이트 접속 안정성 확인과 오류 개선</li>
    <li>콘텐츠 품질 개선을 위한 방문 흐름 분석</li>
    <li>광고 표시, 빈도 조절, 부정 클릭 방지</li>
    <li>문의와 수정 요청에 대한 사실 확인</li>
  </ul>
  <h2>외부 서비스</h2>
  <p>사이트는 호스팅, 보안, 광고, 통계 분석을 위해 외부 서비스를 사용할 수 있습니다. 각 서비스는 자체 개인정보 처리방침과 쿠키 정책에 따라 데이터를 처리할 수 있으며, 사용자는 브라우저 또는 광고 설정에서 맞춤 광고와 쿠키 사용을 제한할 수 있습니다.</p>
  <h2>보관과 삭제</h2>
  <p>문의 처리에 필요한 정보는 요청 목적이 달성된 뒤 불필요하게 보관하지 않습니다. 법령상 보존이 필요한 경우를 제외하고, 개인정보 삭제 요청이 접수되면 확인 가능한 범위에서 처리합니다.</p>
  <p class="ss-page-callout">이 방침은 사이트 운영 방식, 광고 서비스 도입, 분석 도구 변경에 따라 업데이트될 수 있습니다. 중요한 변경이 있을 경우 페이지 내용을 다시 정리합니다.</p>
</div>`
    }
  ],
  [
    "terms-of-service/index.html",
    {
      title: "이용약관 - 여행정보엑스퍼트",
      description:
        "여행정보엑스퍼트 이용약관입니다. 콘텐츠 이용 범위, 정보 정확성, 광고와 제휴, 책임 제한 기준을 안내합니다.",
      body: `
<div class="ss-page">
  <section class="ss-page-hero">
    <p class="ss-page-kicker">Terms of Service</p>
    <h1>이용약관</h1>
    <p class="ss-page-lead">여행정보엑스퍼트의 콘텐츠는 혼자 여행자가 스스로 판단할 수 있도록 돕는 참고 정보입니다. 실제 여행 결정은 최신 현지 정보와 개인 상황을 함께 고려해 내려야 합니다.</p>
  </section>
  <h2>콘텐츠 이용 범위</h2>
  <p>사이트의 글, 표, 체크리스트, 이미지, 구성은 저작권 보호를 받을 수 있습니다. 개인적인 여행 준비를 위한 열람과 참고는 가능하지만, 무단 복제, 대량 수집, 상업적 재배포는 허용하지 않습니다.</p>
  <h2>정보의 성격</h2>
  <table class="ss-page-table">
    <tbody>
      <tr><th>여행 정보</th><td>숙소, 교통, 식당, 일정, 안전 관련 정보는 발행 이후 변경될 수 있으므로 출발 전 공식 안내와 현지 정보를 다시 확인해야 합니다.</td></tr>
      <tr><th>추천 표현</th><td>추천은 모든 독자에게 같은 결과를 보장한다는 뜻이 아니라, 특정 조건에서 검토할 만한 선택지라는 의미입니다.</td></tr>
      <tr><th>안전 정보</th><td>안전 관련 내용은 위험을 줄이기 위한 참고 기준이며, 개별 상황의 안전을 보장하지 않습니다.</td></tr>
      <tr><th>광고와 제휴</th><td>광고 또는 제휴가 포함될 수 있으나, 편집 기준과 독자 이익을 해치는 방식의 콘텐츠는 지양합니다.</td></tr>
    </tbody>
  </table>
  <h2>사용자 책임</h2>
  <ul class="ss-page-list">
    <li>여행 전 비자, 보험, 건강, 안전, 교통, 숙소 예약 조건을 직접 확인해야 합니다.</li>
    <li>현지 법규와 문화, 시설 이용 규칙을 지켜야 합니다.</li>
    <li>사이트 정보를 근거로 한 예약, 결제, 이동 결정의 최종 책임은 사용자에게 있습니다.</li>
  </ul>
  <h2>오류와 수정</h2>
  <p>사이트는 정보의 정확성을 높이기 위해 노력하지만 모든 변경 사항을 실시간으로 반영할 수는 없습니다. 오류가 의심되는 내용은 <a href="/contact/">문의하기</a> 기준에 따라 제보할 수 있으며, 확인된 내용은 적절히 수정합니다.</p>
  <p class="ss-page-callout">이 약관은 독자의 권리를 제한하기보다 정보의 성격과 한계를 명확히 하기 위한 문서입니다. 여행 판단에 큰 영향을 주는 내용은 반드시 최신 공식 자료와 함께 확인해 주세요.</p>
</div>`
    }
  ]
]);

const files = await collectHtmlFiles(rootDir);
let pageCount = 0;
let postCount = 0;
let cssCount = 0;

for (const file of files) {
  const rel = path.relative(rootDir, file).replaceAll("\\", "/");
  if (shouldSkip(rel)) {
    continue;
  }

  const html = await fs.readFile(file, "utf8");
  if (!html.includes("<html")) {
    continue;
  }

  const $ = load(html, { decodeEntities: false });
  if (ensureTrustCss($)) {
    cssCount += 1;
  }

  const page = pages.get(rel);
  if (page) {
    applyPage($, page, rel);
    pageCount += 1;
  }

  if ($(".ss-post").length) {
    applyPostTrustBox($);
    postCount += 1;
  }

  const next = normalizeHtml($.html());
  if (next !== html) {
    await fs.writeFile(file, next, "utf8");
  }
}

console.log(
  `Strengthened trust signals: ${pageCount} required pages, ${postCount} post pages, CSS touched on ${cssCount} HTML files.`
);

async function collectHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (skipSegments.has(entry.name)) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...await collectHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

function shouldSkip(rel) {
  return rel.split("/").some((part) => skipSegments.has(part));
}

function ensureTrustCss($) {
  const existing = $("style").filter((_, el) => $(el).html()?.includes("ss-trust-signals:start")).first();
  if (existing.length) {
    const current = existing.html();
    if (current.includes("ss-trust-signals:end")) {
      existing.html(current.replace(/\/\* ss-trust-signals:start \*\/[\s\S]*?\/\* ss-trust-signals:end \*\//, trustCss.trim()));
    }
    return false;
  }

  const globalStyle = $("#ss-global-style").first();
  if (globalStyle.length) {
    globalStyle.html(`${globalStyle.html()}\n${trustCss}`);
  } else {
    $("head").append(`\n<style id="ss-trust-style">${trustCss}</style>`);
  }
  return true;
}

function applyPage($, page, rel) {
  $("title").text(page.title);
  setMeta($, "description", page.description);
  setProperty($, "og:title", page.title);
  setProperty($, "og:description", page.description);
  setMeta($, "twitter:title", page.title);
  setMeta($, "twitter:description", page.description);
  const url = `${SITE_URL}/${rel.replace(/\/index\.html$/, "/").replace(/^index\.html$/, "")}`;
  setProperty($, "og:url", url);
  const entry = $(".entry-content").first();
  if (entry.length) {
    entry.html(page.body);
  }
}

function applyPostTrustBox($) {
  $(".ss-post .ss-trust-box").remove();
  const reviewedAt = extractReviewedDate($);
  const box = buildTrustBox(reviewedAt);
  const summary = $(".ss-post-summary").first();
  if (summary.length) {
    summary.after(box);
    return;
  }
  const toc = $(".ss-toc").first();
  if (toc.length) {
    toc.before(box);
    return;
  }
  $(".ss-post").first().prepend(box);
}

function buildTrustBox(reviewedAt) {
  return `
      <div class="ss-trust-box">
        <span class="ss-trust-kicker">검수 기준</span>
        <h2>이 글은 이렇게 검토했습니다</h2>
        <ul>
          <li>혼자 여행자가 실제로 판단해야 하는 숙소 위치, 이동 동선, 식사 난이도, 야간 도착 가능성을 우선 확인했습니다.</li>
          <li>교통, 영업시간, 요금처럼 바뀔 수 있는 정보는 현장 확인이 필요하다는 전제를 함께 표시했습니다.</li>
          <li>특정 업체 추천보다 독자가 스스로 비교할 수 있는 기준과 예외 상황을 먼저 정리했습니다.</li>
        </ul>
        <p class="ss-trust-note">최종 검토일: ${reviewedAt} · 작성/검수: ${SITE_NAME} · 오류 제보와 수정 요청은 <a href="/contact/">문의하기</a>에서 받습니다.</p>
      </div>`;
}

function extractReviewedDate($) {
  const candidates = [
    $('meta[property="article:modified_time"]').attr("content"),
    $('meta[property="article:published_time"]').attr("content"),
    $("time.updated").attr("datetime"),
    $("time.entry-date").attr("datetime")
  ].filter(Boolean);

  for (const candidate of candidates) {
    const date = new Date(candidate);
    if (!Number.isNaN(date.valueOf())) {
      return date.toISOString().slice(0, 10);
    }
  }
  return today;
}

function setMeta($, name, content) {
  const node = $(`meta[name="${name}"]`).first();
  if (node.length) {
    node.attr("content", content);
  } else {
    $("head").append(`\n<meta name="${name}" content="${content}">`);
  }
}

function setProperty($, property, content) {
  const node = $(`meta[property="${property}"]`).first();
  if (node.length) {
    node.attr("content", content);
  } else {
    $("head").append(`\n<meta property="${property}" content="${content}">`);
  }
}

function normalizeHtml(html) {
  return html.replace(/[ \t]+$/gm, "");
}
