import { TOKYO_SENSITIVITY } from '../assets/tokyo-stay-case.js';

export const ANALYSIS_ROUTE = '/analysis/tokyo-stay-cost/';
export const ANALYSIS_TITLE = '도쿄 숙소 2박 비교: 숙박세·이동비의 가격 역전 경계';
export const ANALYSIS_DESCRIPTION = '1인 2박의 공개 규정 기반 가상 분석입니다. 교통비 차이 1,300엔의 손익분기점, 2027년 숙박세 변경, 일반 취소 마감과 자정 체크인을 분리해 비교합니다.';
export const ANALYSIS_MODIFIED = '2026-11-22T22:15:00+09:00';
export const ANALYSIS_SOURCES = {
  tax: 'https://www.tax.metro.tokyo.lg.jp/kazei/leisure/shuk/%EF%BC%92',
  reform: 'https://www.my.metro.tokyo.lg.jp/w/008-20260630-260454292?redirect=%2Frss%3Fp_p_id%3Dcom_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_rijn%26p_p_lifecycle%3D0%26p_p_state%3Dnormal%26p_r_p_categoryId%3D55239787',
  hotelTax: 'https://www.sequencehotels.com/tax/',
  toyoko: 'https://www.toyoko-inn.com/eng/support/',
  superFaq: 'https://www.superhoteljapan.com/en/faq01.html',
  superTerms: 'https://www.superhoteljapan.com/en/yakkan.html'
};
const num = value => value.toLocaleString('ko-KR');
const result = row => row.a === row.b ? '동일' : `${row.a < row.b ? 'A' : 'B'}가 ${num(Math.abs(row.a - row.b))}엔 적음`;

export const ANALYSIS_CONTENT = `
<div class="ss-research ss-regional-guide">
<header class="ss-research-header"><p class="ss-eyebrow">예약 비용 분석</p><h1>${ANALYSIS_TITLE}</h1><p>발행·자료 대조 2026-11-22 · 작성 <a href="/author/">여행엑스퍼트(필명)</a></p><p>숙박세를 더한 객실 대금은 A가 1,300엔 저렴해도, A에서 추가로 드는 교통비가 그 차이를 넘으면 결론이 바뀝니다. 이 사례의 기본 합계는 A 23,360엔, B 23,260엔입니다. 차이는 100엔이므로 미확인 비용 하나로도 순위가 달라집니다.</p></header>
<aside class="ss-research-scope"><strong>공식 규정 + 가상 후보 분석</strong><p>판매 중인 객실·실제 숙소 두 곳의 견적·이용 후기가 아닙니다. 도쿄의 숙박세와 호텔 운영자의 공개 규정을 읽고, 같은 1인 2박 조건에 편집자가 설정한 가격·이동비를 넣었습니다. 후보 A/B는 아래 출처의 호텔 브랜드를 뜻하지 않습니다.</p></aside>
<nav class="ss-toc" aria-label="이 분석의 목차"><div class="ss-toc-head">목차</div><ol><li><a href="#case-inputs">같은 2박 조건의 입력값</a></li><li><a href="#tax-dates">숙박일에 따라 달라지는 숙박세</a></li><li><a href="#break-even">가격이 뒤집히는 경계</a></li><li><a href="#arrival-cancel">가격보다 먼저 볼 취소·체크인</a></li><li><a href="#reproduce">같은 계산을 다시 해보기</a></li><li><a href="#case-decision">어느 조건에서 선택을 멈추나</a></li></ol></nav>
<div class="ss-post-body">
<h2 id="case-inputs">같은 2박 조건의 입력값</h2>
<p>여행일은 <strong>2026년 12월 10일 체크인~12월 12일 체크아웃, 성인 1명·객실 1개·2박·조식 없음</strong>으로 가정합니다. 예약 조회를 한 날짜가 아니라 계산을 위한 숙박일입니다. 다른 박수·인원·식사·취소 가능 상품을 섞지 않습니다. 아래 금액은 모두 엔(JPY)이며 특정 공항·호텔의 실제 교통 운임은 아닙니다.</p>
<figure class="wp-block-table"><table><caption>표시 가격을 조사한 견적이 아닌 분석용 입력 · 숙박세는 별도 결제로 가정</caption><thead><tr><th>항목</th><th>가상 A</th><th>가상 B</th></tr></thead><tbody>
<tr><td>숙박세 계산의 기초가 되는 1인 1박 요금</td><td>9,800엔</td><td>10,300엔</td></tr>
<tr><td>소비세 등 포함, 숙박세 제외 2박 숙박대금</td><td>21,560엔</td><td>22,660엔</td></tr>
<tr><td>별도로 낼 2박 숙박세</td><td>0엔</td><td>200엔</td></tr>
<tr><td>같은 범위의 숙소 관련 교통비 합계</td><td>1,800엔</td><td>400엔</td></tr>
<tr><td>기본 가정의 합계</td><td><strong>23,360엔</strong></td><td><strong>23,260엔</strong></td></tr>
</tbody></table></figure>
<p>두 번째 행은 결제액에 관한 가정, 첫 번째 행은 숙박세 계산 기초에 관한 가정입니다. 결제 화면의 합계를 그대로 1박 세금 구간에 대입하지 않습니다. 실제 상품에서는 식사·서비스료·세금 포함 여부와 인원별 배분을 시설에 확인한 금액으로 바꿔야 합니다. 숙박세가 이미 포함된 총액이라면 별도 세금 행은 다시 더하지 않습니다.</p>
<div class="ss-cost-reading" aria-label="기본 가정의 총비용 비교"><div><strong>A · 23,360엔</strong><meter min="0" max="25000" value="23360">23,360 / 25,000</meter><span>객실·숙박세 21,560 + 교통 1,800</span></div><div><strong>B · 23,260엔</strong><meter min="0" max="25000" value="23260">23,260 / 25,000</meter><span>객실·숙박세 22,860 + 교통 400</span></div></div>
<h2 id="tax-dates">숙박일에 따라 달라지는 숙박세</h2>
<p><a href="${ANALYSIS_SOURCES.tax}">도쿄도 주세국 숙박세 안내</a>는 현행 1인 1박 과세 기준에서 10,000엔 미만 비과세, 10,000엔 이상~15,000엔 미만 100엔, 15,000엔 이상 200엔으로 설명합니다. 이 사례의 과세 기초를 그대로 적용하면 A는 0 × 2 = 0엔, B는 100 × 2 = 200엔입니다. 일반 여행자 기준의 계산 예시이며 면제 대상·개별 청구를 판정하는 문서는 아닙니다.</p>
<p><a href="${ANALYSIS_SOURCES.reform}">도쿄도의 제도 변경 발표</a>는 <strong>2027년 4월 1일 숙박분부터</strong> 1인 1박 13,000엔 미만 비과세, 과세 대상에는 숙박요금의 3%를 적용한다고 알립니다. 2026년에 미리 예약했는지보다 실제 숙박일이 기준입니다. 이 글의 A/B 요금 기초를 그대로 유지한 2027년 4월 10~12일 가정에서는 두 후보 모두 13,000엔 미만이므로 B의 숙박세 200엔이 빠져 B의 합계는 23,060엔이 됩니다. 실제 2027년 객실 가격이 같다는 예측은 아닙니다.</p>
<p><a href="${ANALYSIS_SOURCES.hotelTax}">sequence의 숙박세 안내</a>도 도쿄의 변경일과 별도 징수 방식을 게시합니다. 이것을 일본 전국·모든 호텔의 가격 표시 방식으로 일반화하지 않습니다. 해당 페이지의 과세 기초 설명처럼 식사와 소비세 등의 항목은 따로 봅니다. 적용일은 도쿄도 자료를 우선하며, 이 분석은 세무 신고나 환불 권리 판단을 대신하지 않습니다.</p>
<h2 id="break-even">가격이 뒤집히는 경계</h2>
<p>숙박대금과 숙박세를 합치면 B는 22,860엔, A는 21,560엔입니다. <strong>B의 객실 관련 차액은 1,300엔</strong>입니다. 따라서 A의 교통비가 B보다 1,300엔 더 들면 같고, 그보다 더 들면 B의 이용 합계가 작아집니다. 이때 이동 시간·접근성·체크인은 아직 가격 평가에 포함하지 않았습니다.</p>
<figure class="wp-block-table"><table><caption>한 항목만 바꾼 민감도 분석 · 모든 행은 같은 1인 2박 가정</caption><thead><tr><th>바꾼 조건</th><th>A 합계</th><th>B 합계</th><th>비용만 본 결과</th></tr></thead><tbody>${TOKYO_SENSITIVITY.map(row => `<tr><td>${row.label}</td><td>${num(row.a)}엔</td><td>${num(row.b)}엔</td><td>${result(row)}</td></tr>`).join('')}</tbody></table></figure>
<p>B의 교통을 400엔으로 두면 A의 교통 <strong>1,700엔</strong>에서 동률입니다. 기본 가정의 A 교통 1,800엔은 이 경계보다 100엔 높을 뿐입니다. 그래서 미확인 보관료를 0엔으로 적거나 한쪽에만 공항 왕복을 넣으면 계산의 의미가 바뀝니다. 교통비는 두 후보에 공통인 관광 이동을 모두 포함하거나 모두 제외하는 등 같은 범위로 맞춥니다.</p>
<p>별도 비용 1,000엔 행은 민감도를 보기 위한 가정입니다. <a href="${ANALYSIS_SOURCES.toyoko}">토요코인 공식 이용 안내</a>에는 빈 객실이 있는 경우에 한해 14시까지 시간당 1,000엔의 연장요금이 게시돼 있습니다. 실제로 객실을 더 쓰는 일과 짐만 맡기는 일은 다릅니다. 어느 가상 후보가 이 서비스를 제공한다거나 연장이 승인됐다는 뜻은 아니며, 1,000엔이라는 추가 항목 하나가 작은 가격 차이를 뒤집는 이유를 보여줍니다.</p>
<h2 id="arrival-cancel">가격보다 먼저 볼 취소·체크인</h2>
<p>요금 합계가 작아도 도착할 때 체크인이 안 되면 선택을 확정할 수 없습니다. 아래는 후보 A/B의 계약 조건이 아니라 <strong>실제 운영자 두 곳의 공개 규정을 읽는 별도 사례</strong>입니다. 일본 현지 시각 기준이며 특별 상품·단체·예약 플랫폼의 별도 조건을 같은 것으로 취급하지 않습니다.</p>
<figure class="wp-block-table"><table><caption>2026-11-22 대조 · 일반 안내이며 특정 예약의 취소 승인 아님</caption><thead><tr><th>공식 안내</th><th>게시 조건</th><th>14:00 취소 가정의 해석</th></tr></thead><tbody><tr><td>토요코인 이용 안내</td><td>체크인 당일 12:00 전 수수료 없음, 이후·노쇼 숙박료 100%. 별도 상품·외부 예약 예외 표시</td><td>해당 일반 조건이 적용되는 계약이라면 이미 정오 마감을 지남</td></tr><tr><td><a href="${ANALYSIS_SOURCES.superTerms}">Super Hotel 일반 개인 예약 약관</a></td><td>당일 15:00 전 0%, 15:00부터 100%를 별도 표시</td><td>해당 개인 예약 조건이면 아직 15:00 전. 위 호텔의 정오 마감을 복사하지 않음</td></tr></tbody></table></figure>
<p><a href="${ANALYSIS_SOURCES.superFaq}">Super Hotel FAQ</a>는 일반 체크인을 15:00~24:00으로, 프리미어 도쿄역 야에스 중앙구점은 25:00까지라는 예외로 안내합니다. 가상 도착 23:35가 45분 늦어지면 <strong>다음 날 00:20</strong>입니다. 일반 24:00 마감은 지났고 예외의 25:00 전이지만, 이것만으로 그 지점의 객실·접수·예약 유지가 확정되지는 않습니다. FAQ는 예정 시각보다 크게 늦으면 호텔에 연락하도록 합니다.</p>
<p>이용 비용과 취소 손실은 다른 상황입니다. 실제 예약의 당일 취소 손실이 숙박료 100%라고 확인됐더라도, 이용할 때 합계에 그 금액을 또 더하지 않습니다. 계약 문서·현지 취소 마감·연락 결과를 나란히 놓고, 체크인 불가인 후보는 가격 순위에서 먼저 제외합니다.</p>
<h2 id="reproduce">같은 계산을 다시 해보기</h2>
<p><a href="/assets/tokyo-stay-case.csv" download>분석 입력·합계 CSV 내려받기</a>에는 두 후보의 엔화 금액과 계산 범위를 담았습니다. <a href="/assets/tokyo-stay-review.txt" download>예약 확인표</a>에는 실제 가격·세금 포함·교통 범위·취소 마감·출입 가능 여부를 적습니다. 개인용 파일이며 이 사이트로 제출하지 않습니다.</p>
<p><a class="ss-inline-link" href="/tools/stay-compare/?example=tokyo-2026">이 사례를 숙소 비교기에서 계산하기</a>에서는 버튼을 누르면 <strong>1엔 = 10원이라는 설명용 환산 가정</strong>의 값이 들어갑니다. 현재 환율이 아닙니다. A는 숙박 215,600원·추가금 0원·교통 18,000원, B는 숙박 226,600원·추가금 2,000원·교통 4,000원으로 총 233,600원과 232,600원입니다. 실제 결제 환율·수수료로 바꾸기 전에는 원화 견적이 아니며 취소·체크인은 미확인으로 남깁니다.</p>
<h2 id="case-decision">어느 조건에서 선택을 멈추나</h2>
<ul><li>실제 입력이 이 가정과 같고 두 후보의 이용 가능 조건도 같다면 B의 이용 합계가 100엔 적습니다.</li><li>A의 교통비가 1,700엔이면 동률입니다. 작은 차액을 숙소 품질이나 이동 편의의 점수로 바꾸지 않습니다.</li><li>체크인 불가가 확인되면 금액 비교 전에 제외합니다. 핵심 추가비용이 미확인이면 최종 가격 추천을 보류합니다.</li><li>여행일이 2027년 4월 이후라면 숙박세부터 다시 계산합니다. 예약 조회일만 바꾸거나 과거 표를 그대로 쓰지 않습니다.</li></ul>
<p>일반적인 비교 방법은 <a href="/honja-yeohaeng-sukso-goreuneun-beop/">숙소 선택 가이드</a>, 짐 회수와 출발의 연결은 <a href="/honja-yeohaeng-achim-routine/">체크아웃 당일 실행표</a>로 이어집니다. 근거와 다른 부분은 <a href="/contact/">원문 URL과 함께 오류 제보</a>로 알려주세요.</p>
</div></div>`;
