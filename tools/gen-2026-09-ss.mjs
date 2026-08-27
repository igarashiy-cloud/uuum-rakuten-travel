#!/usr/bin/env node
/**
 * 2026年9月 楽天トラベル スーパーSALE の投稿スケジュールを組み、
 * master-csv の schedule / schedule_phases / sales / phases / links を作り直す。
 *
 *   node tools/gen-2026-09-ss.mjs
 *
 * 既存の行（2026-06-ss と common）はそのまま残し、9月分を足すだけ。
 * 出来たCSVをスプレッドシートに「現在のシートを置換する」でインポートする。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../sale-master/master-csv');
const ID = '2026-09-ss';
const SCID = 'af_trv_2026uurakuten';

// ---------------------------------------------------------------- CSV
function parseCsv(t) {
  const s = t.replace(/^﻿/, ''); const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < s.length; i++) { const c = s[i];
    if (q) { if (c === '"') { if (s[i+1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c; }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const h = rows.shift();
  return { headers: h, rows: rows.filter(r => r.some(v => v !== '')).map(r => Object.fromEntries(h.map((x, i) => [x, r[i] ?? '']))) };
}
const toCsv = (h, rows) => '﻿' + [h.join(','), ...rows.map(r => h.map(k => {
  const v = String(r[k] ?? ''); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}).join(','))].join('\n') + '\n';
const read = n => parseCsv(readFileSync(resolve(DIR, n + '.csv'), 'utf8'));
const write = (n, h, rows) => { writeFileSync(resolve(DIR, n + '.csv'), toCsv(h, rows), 'utf8');
  console.log('  ' + (n + '.csv').padEnd(22) + String(rows.length).padStart(3) + ' 行'); };

// ---------------------------------------------------------------- リンク
// 提示されたURLには計測用の scid が付いていなかったため、6月と同じものを付けている
const withScid = u => u + (u.includes('?') ? '&' : '?') + 'scid=' + SCID;
const U = {
  top:      withScid('https://event.travel.rakuten.co.jp/special/supersale/'),
  hotel35:  withScid('https://search.travel.rakuten.co.jp/ds/undated/search?f_dai=japan&f_sort=hotel&f_page=1&f_hyoji=30&f_tab=hotel&f_cd=02&f_layout=grid&f_campaign=17ss2609cp_34&f_charge_users=2'),
  park25:   withScid('https://search.travel.rakuten.co.jp/ds/undated/search?f_dai=japan&f_sort=hotel&f_page=1&f_hyoji=30&f_tab=hotel&f_cd=02&f_layout=grid&f_campaign=17ss2609cp_35&f_charge_users=2'),
  chain33:  withScid('https://search.travel.rakuten.co.jp/ds/undated/search?f_dai=japan&f_sort=hotel&f_page=1&f_hyoji=30&f_tab=hotel&f_cd=02&f_layout=grid&f_campaign=17ss2609cp_20&f_charge_users=2'),
  parkPre:  withScid('https://travel.rakuten.co.jp/themepark/special-offers/'),
  chainPre: withScid('https://travel.rakuten.co.jp/special/special-offers/chain/202609/'),
  half:     withScid('https://search.travel.rakuten.co.jp/ds/undated/search?f_dai=japan&f_sort=hotel&f_page=1&f_hyoji=30&f_tab=hotel&f_cd=02&f_layout=grid&f_campaign=17ss260950_14&f_charge_users=2'),
  coupon:   withScid('https://event.travel.rakuten.co.jp/special/sales/coupon/4000.html'),
  deal:     withScid('https://travel.rakuten.co.jp/superdeal/special/ss2609/index.html'),
  limited:  withScid('https://search.travel.rakuten.co.jp/ds/undated/search?f_dai=japan&f_sort=hotel&f_page=1&f_hyoji=30&f_tab=hotel&f_cd=02&f_layout=grid&f_campaign=17ss2609lm_14&f_charge_users=2'),
};
const d = (...pairs) => pairs.map(([l, u]) => `${l} :: ${u}`).join('\n');

// ---------------------------------------------------------------- 35日分
// [月, 日, カード色, タグ, バッジ, テーマ, 訴求コピー, 誘導先]
const DAYS = [
// ── 告知期間 8/28 10:00 〜 9/1 19:59 ──
[8,28,'announce','announce','announce:告知スタート',
 '開幕告知！9/4(金)20時スタート',
 '🎊 楽天トラベル スーパーSALE、9月4日(金)20時スタート！旅行予約が毎日最大35%OFF✨ 告知期間の今から対象ホテルは見られます。開幕と同時に予約できるよう、目星をつけておこう👇',
 d(['公式ページ',U.top])],
[8,29,'announce','announce','announce:告知',
 'ホテル最大35%OFF 下見のすすめ',
 '🏨 SALE開幕まであと6日。最大35%OFFになる対象ホテルはもう公開されています。人気宿は開幕直後に埋まるので、週末のうちに候補を絞っておくのがおすすめです☺️',
 d(['ホテル最大35%OFF',U.hotel35])],
[8,30,'announce','announce','announce:告知',
 'テーマパーク提携ホテル 最大25%OFF',
 '🎢 テーマパークに行くなら提携ホテルが最大25%OFF🎡 パーク直結・送迎ありの宿はSALE中に争奪戦になります。今のうちに第3候補まで決めておくと安心です！',
 d(['テーマパーク提携ホテル',U.park25])],
[8,31,'announce','announce','announce:告知',
 'チェーンホテル 最大33%OFF',
 '🏩 チェーンホテルは最大33%OFF。全国どこでも使えて、出張にも弾丸旅行にも便利です✈️ 明日10時からは一部会員向けの先行SALEもスタート⏰',
 d(['チェーンホテル',U.chain33])],
// ── 先行SALE 9/1 10:00 〜 9/4 19:59 ──
[9,1,'pre','announce','announce:告知最終日 | pre:先行SALE 10:00〜',
 '先行SALEスタート！※一部会員限定',
 '⚡️ 本日10時から先行SALEスタート！（一部会員限定）半額プランやチェーンホテルを、本番を待たずに押さえられます🔥 対象の方はメールをチェックしてみて！',
 d(['半額プラン',U.half],['チェーンホテル',U.chainPre])],
[9,2,'pre','announce','pre:先行SALE',
 '半額プラン 先行チェック',
 '🏷️ 先行SALEの目玉は半額プラン。数量限定なので、対象の方はお早めに✨ 対象外だった方も、9/4(金)20時の本番で同じプランが狙えます📅',
 d(['半額プラン',U.half])],
[9,3,'pre','announce','pre:先行SALE',
 '開幕前日！エントリーリマインド',
 '📣 明日20時、いよいよ本番スタート！エントリー＆ご旅行で抽選2,500名様に最大全額ポイントバック🎯 楽天モバイルご利用なら当選確率2倍！予約前のエントリーをお忘れなく',
 d(['公式ページ',U.top])],
[9,4,'main','announce main','pre:先行SALE 最終日 | main:🎉 本SALE 20:00〜',
 '本SALE開幕！毎日最大35%OFF',
 '🎉 キタ！楽天トラベル スーパーSALEが今夜20時に開幕！旅行予約が毎日最大35%OFF✨ 初めてのアプリ予約ならクーポン＋SALEプランでさらにお得。10月1日(木)朝9:59まで！',
 d(['公式ページ',U.top])],
// ── 本SALE 9/4 20:00 〜 10/1 9:59 ──
[9,5,'50day','main 50day','main:本SALE | 50day:⏰ 5のつく日 START（〜9/7 23:59）',
 '5のつく日 72時間スタート ＋ 初の週末',
 '⏰ 5のつく日スタート！今回は72時間に延長🔥 SALEと重なって旅行予約が最大35%OFF。週末のうちに秋旅の計画を立てて、そのまま予約しちゃおう🍁',
 d(['公式ページ',U.top])],
[9,6,'50day','main 50day','main:本SALE | 50day:⏰ 5のつく日 継続中',
 '最大4,000円割引クーポン',
 '🎫 最大4,000円割引クーポンは「取得してから予約」が鉄則！5のつく日と重ねれば割引×ポイントのW取りになります💰 取り忘れに注意',
 d(['割引クーポン',U.coupon])],
[9,7,'50day','main 50day','main:本SALE | 50day:⏰ 5のつく日 本日23:59まで',
 '5のつく日 ラストコール',
 '⚡️ 5のつく日は本日23:59まで！迷っている宿があるなら今日中に📅 旅行日が先でも、予約日をこの日に合わせるだけで還元が変わります',
 d(['公式ページ',U.top])],
[9,8,'main','main','main:本SALE',
 '楽パック 最大30,000円クーポン',
 '✈️ 交通＋宿の楽パックは最大30,000円クーポン！別々に取るより安くなるケースが多いです🚄 新幹線＋宿のプランもあるので国内の遠出にも◎',
 d(['公式ページ',U.top])],
[9,9,'main','main','main:本SALE',
 'レンタカー 最大50%OFF',
 '🚗 レンタカーが最大50%OFF！宿とセットで押さえると行動範囲が一気に広がります🍁 紅葉ドライブを考えているなら今のうちに',
 d(['公式ページ',U.top])],
[9,10,'50day','main 50day','main:本SALE | 50day:⏰ 0のつく日 START（〜9/12 23:59）',
 '0のつく日 72時間スタート',
 '🎊 0のつく日スタート！こちらも72時間🔥 SALE×5と0の日は還元率が跳ね上がるタイミングです。週末旅行の予約はこの3日間で決めよう！',
 d(['公式ページ',U.top])],
[9,11,'50day','main 50day','main:本SALE | 50day:⏰ 0のつく日 継続中',
 'スーパーDEAL 高還元',
 '💰 スーパーDEAL対象なら、支払った金額の一部がポイントで戻ってきます✨ 割引とポイント還元を同時に取れるのはSALE期間だけ！',
 d(['スーパーDEAL',U.deal])],
[9,12,'50day','main 50day','main:本SALE | 50day:⏰ 0のつく日 本日23:59まで',
 '0のつく日 最終日 ＋ 週末',
 '⏰ 0のつく日は本日23:59まで！週末に予定を決めて、その勢いで予約するのが一番おトクです🏨 来週は5連休前の駆け込みで一気に埋まります',
 d(['公式ページ',U.top])],
[9,13,'main','main','main:本SALE',
 '遊び・体験 最大30%OFF',
 '🎡 遊び・体験のチケットが最大30%OFF！水族館・テーマパーク・アクティビティも宿と一緒に予約すると計画がラクになります🐟',
 d(['公式ページ',U.top])],
[9,14,'main','main','main:本SALE',
 'SALE限定プラン訴求',
 '⏳ SALE期間だけの限定プランをチェック！通常では出てこない条件の宿が並びます✨ 気になったら早めに押さえるのが正解です',
 d(['限定プラン',U.limited])],
[9,15,'50day','main 50day','main:本SALE | 50day:⏰ 5のつく日 START（〜9/17 23:59）',
 '5のつく日 START ＋ 5連休が目前',
 '🔥 5のつく日スタート、今から72時間！そして今週末からは9/19〜9/23の5連休🍁 連休の宿は埋まる一方なので、予約はこのタイミングが勝負です',
 d(['公式ページ',U.top])],
[9,16,'50day','main 50day','main:本SALE | 50day:⏰ 5のつく日 継続中',
 'エントリー＆ポイントバック訴求',
 '🎯 エントリーはもう済んでる？エントリー＆ご旅行で抽選2,500名様に最大全額ポイントバック！楽天モバイルご利用なら当選確率2倍✨ 予約の前に必ずエントリーを',
 d(['公式ページ',U.top])],
[9,17,'50day','main 50day','main:本SALE | 50day:⏰ 5のつく日 本日23:59まで',
 '5のつく日 ラストコール ＋ 連休2日前',
 '⚡️ 5のつく日は本日23:59まで！5連休は目前ですが、直前でも取れる宿はまだあります🏨 今日中に押さえておくのが一番おトク',
 d(['公式ページ',U.top])],
[9,18,'main','main','main:本SALE',
 '5連休 前日！直前予約',
 '🍁 明日から9/19〜9/23の5連休！まだ間に合います。最大35%OFFで直前予約できる宿を探そう🚗 レンタカーも最大50%OFFなので移動込みで組むのが◎',
 d(['公式ページ',U.top])],
[9,19,'main','main','main:本SALE',
 '5連休スタート',
 '🎉 5連休スタート！お出かけ中の方も、次の旅行の予約はSALE期間中に済ませるのが正解です✨ 最大35%OFFは10/1(木)朝9:59まで',
 d(['公式ページ',U.top])],
[9,20,'50day','main 50day','main:本SALE | 50day:⏰ 0のつく日 START（〜9/22 23:59）',
 '0のつく日 START ＋ 連休ど真ん中',
 '🔥 連休のど真ん中で0のつく日スタート！しかも72時間。旅先からスマホで、次の旅行をお得に予約できるチャンスです📱',
 d(['公式ページ',U.top])],
[9,21,'50day','main 50day','main:本SALE | 50day:⏰ 0のつく日 継続中',
 '敬老の日 ＋ 0のつく日',
 '🎁 今日は敬老の日。プレゼントに家族旅行はいかがですか？温泉宿も最大35%OFFで狙えます♨️ 0のつく日と重なって、今が一番おトクなタイミング',
 d(['公式ページ',U.top])],
[9,22,'50day','main 50day','main:本SALE | 50day:⏰ 0のつく日 本日23:59まで',
 '0のつく日 最終日 ＋ 連休4日目',
 '⏰ 0のつく日は本日23:59まで！連休中に年末年始の宿まで押さえる人も増えています📅 予約日を今日に合わせるだけで還元が変わります',
 d(['公式ページ',U.top])],
[9,23,'main','main','main:本SALE',
 '連休最終日 ＋ 秋旅・年末訴求',
 '🍁 5連休最終日。次の三連休や年末年始の宿はもう押さえた？SALEは10/1(木)朝9:59まで、早く動くほど選択肢が多いです✨',
 d(['公式ページ',U.top])],
[9,24,'main','main','main:本SALE',
 '海外旅行 最大50,000円クーポン',
 '🌏 海外旅行は最大50,000円クーポン！年末年始の海外を考えているなら、このSALEで押さえておくのが正解です✈️',
 d(['公式ページ',U.top])],
[9,25,'50day','main 50day','main:本SALE | 50day:⏰ 5のつく日 START（〜9/27 23:59）',
 '5のつく日 START ＋ SALE残り1週間',
 '⏰ 5のつく日スタート、今から72時間🔥 SALE本体も残り1週間を切りました。迷っている宿があるなら、この3日間が最後の狙い目です',
 d(['公式ページ',U.top])],
[9,26,'50day','main 50day','main:本SALE | 50day:⏰ 5のつく日 継続中',
 '高速バス 最大1,000円クーポン',
 '🚌 高速バスは最大1,000円クーポン！交通費を抑えたぶん宿にお金をかけられます💡 学生さんや弾丸旅行にもおすすめの組み合わせ',
 d(['公式ページ',U.top])],
[9,27,'50day','main 50day','main:本SALE | 50day:⏰ 5のつく日 本日23:59まで',
 '5のつく日 ラストコール',
 '⚡️ 5のつく日は本日23:59まで！SALE本体も残り4日です⏳ 週末のうちに予約を済ませておきましょう',
 d(['公式ページ',U.top])],
[9,28,'main','main','main:本SALE 残り3日',
 '割引クーポン 再訴求',
 '🎫 最大4,000円割引クーポン、取り忘れていませんか？取得してから予約するだけで金額が変わります💰 SALEは10/1(木)朝9:59まで！',
 d(['割引クーポン',U.coupon])],
[9,29,'main','main','main:本SALE 残り2日',
 '限定プラン ラストチャンス',
 '⏳ SALE限定プランは終了と同時に消えます。気になっていた宿があるなら今のうちに🏨 残り2日、見逃しがないか最終チェックを',
 d(['限定プラン',U.limited])],
[9,30,'50day','main 50day','main:本SALE 明日最終日 | 50day:⏰ 0のつく日 START',
 '0のつく日 ＋ 明日でSALE終了',
 '🚨 0のつく日スタート、そしてSALEは明日10/1(木)朝9:59で終了！最後の駆け込みチャンスです🔥 見逃した宿がないか最終チェックを',
 d(['公式ページ',U.top])],
[10,1,'last','main last 50day','last:🔴 本日9:59まで | 50day:⏰ 0のつく日 継続中',
 '最終日！朝9:59でSALE終了',
 '🔴 本日9:59でスーパーSALE終了！朝までのラストスパートです⏰ 最大35%OFFは今日の午前まで。迷っていた宿は今すぐ押さえて！',
 d(['公式ページ',U.top])],
];

// ---------------------------------------------------------------- 生成
const W = ['日','月','火','水','木','金','土'];
console.log('2026年9月スーパーSALE の訴求スケジュールを組みます\n');

const schedule = read('schedule');
const kept = schedule.rows.filter(r => r.sale_id !== ID);
const newRows = DAYS.map(([m, day, card, tags, badges, theme, copy, dests], i) => {
  const dow = new Date(2026, m - 1, day).getDay();
  const row = Object.fromEntries(schedule.headers.map(h => [h, '']));
  return Object.assign(row, {
    sale_id: ID, 表示順: i + 1,
    // 6月と同じく、開幕日(9/4)までを告知フェーズに入れる
    フェーズ: (m === 8 || day <= 4) && m !== 10 ? 'announce' : 'main',
    日付: `${m}/${day}`, 曜日: W[dow] + '曜日',
    曜日色: dow === 0 ? 'sun' : dow === 6 ? 'sat' : '',
    カード色: card, タグ: tags, バッジ: badges,
    テーマ: theme, 訴求コピー: copy, 誘導先: dests,
  });
});
write('schedule', schedule.headers, [...kept, ...newRows]);

const sp = read('schedule_phases');
write('schedule_phases', sp.headers, [...sp.rows.filter(r => r.sale_id !== ID),
  { sale_id: ID, 表示順: 1, フェーズID: 'announce', 色: 'var(--orange)',
    ラベル: '告知・先行SALE期', 期間: '8/28(金) 10:00〜9/4(金) 19:59' },
  { sale_id: ID, 表示順: 2, フェーズID: 'main', 色: 'var(--green)',
    ラベル: '本SALE 開催中', 期間: '9/4(金) 20:00〜10/1(木) 9:59' },
]);

console.log('\n【内訳】');
const byTag = {};
newRows.forEach(r => r.タグ.split(' ').forEach(t => byTag[t] = (byTag[t] || 0) + 1));
Object.entries(byTag).forEach(([k, v]) => console.log('  ' + k.padEnd(10) + v + '日'));
console.log('  ' + '合計'.padEnd(10) + newRows.length + '日（8/28〜10/1）');

// ---------------------------------------------------------------- セール本体
// schedule だけでは表示されないので、sales / phases / links なども揃える。
// 内容は共有された告知資料から起こしたもの。

const upsert = (name, rows) => {
  const cur = read(name);
  const merged = [...cur.rows.filter(r => r.sale_id !== ID),
    ...rows.map(r => Object.assign(Object.fromEntries(cur.headers.map(h => [h, ''])), { sale_id: ID }, r))];
  write(name, cur.headers, merged);
};

upsert('sales', [{
  公開: 'TRUE', 種別: 'supersale', セール名: '楽天トラベル スーパーSALE',
  開始日時: '2026-08-28 10:00', 終了日時: '2026-10-01 09:59',
  ひとこと説明: '旅行予約が毎日最大35%OFF。9/4(金)20時開幕、10/1(木)朝9:59まで。5と0のつく日は72時間に延長されます。',
  セールURL: U.top, スケジュール公開日: '2026-08-28', 期別ラベル: '2026年9月',
  hero_eyebrow: 'RAKUTEN TRAVEL SUPER SALE 2026',
  hero_title: '旅行予約が毎日\n最大<span class="pct">35%</span>OFF',
  hero_sub: '楽天トラベル スーパーSALEが9月4日(金)20時より開幕！\n初めてのアプリ予約ならクーポン＋SALEプランで最大<strong>35%OFF</strong>。',
  hero_note: '* 5と0のつく日は今回も72時間に延長。SALE期間中に6回訪れます',
  cta_label: '▶ 今すぐチェックする', cta_url: U.top,
  スケジュール期間: '8月28日〜10月1日 ／ 全35日 ／ 汎用コピー案（チャネルに合わせて適宜調整してください）',
}]);

upsert('phases', [
  { 表示順:1, 日付:'8/28(金)', 時刻:'10:00〜', 色:'#C97B2C', フェーズ名:'告知期間スタート',
    フェーズ背景色:'#FBF3E9', フェーズ文字色:'#99631F', 見出し:'スーパーSALE 告知開始',
    詳細:'SNS・各チャネルで開幕予告を投稿するタイミング。対象ホテルはこの時点から見られます',
    終了表記:'〜 9/1(火) 19:59 まで' },
  { 表示順:2, 日付:'9/1(火)', 時刻:'10:00〜', 色:'#17A06B', フェーズ名:'先行SALE',
    フェーズ背景色:'#EFF7F3', フェーズ文字色:'#0E7A55', 見出し:'先行セール開始（一部会員限定）',
    詳細:'半額プラン・チェーンホテル最大<strong>33%OFF</strong>などを本番前に予約できます',
    終了表記:'〜 9/4(金) 19:59 まで' },
  { 表示順:3, 日付:'9/4(金)', 時刻:'20:00〜', 色:'#0E7A55', フェーズ名:'🎉 本SALE 開幕',
    フェーズ背景色:'#EFF7F3', フェーズ文字色:'#0E7A55', 見出し:'スーパーSALE 本番スタート！',
    詳細:'毎日最大<strong>35%OFF</strong> ／ 遊び・体験 最大30%OFF\nポイントバックキャンペーン エントリー受付開始',
    終了表記:'〜 10/1(木) 9:59 まで' },
  { 表示順:4, 日付:'5と0の日', 時刻:'各72時間', 色:'#4FB8A5', フェーズ名:'5と0のつく日 特別開催',
    フェーズ背景色:'#EAF6F2', フェーズ文字色:'#2E8F7E', 見出し:'72時間 × 6回 開催' },
  { 表示順:5, 日付:'10/1(木)', 時刻:'9:59 終了', 色:'#999', フェーズ名:'最終日',
    フェーズ背景色:'#F0F0F0', フェーズ文字色:'#666', 見出し:'スーパーSALE 終了',
    詳細:'午前で終了するので、ラストコール投稿は前日夜〜当日朝に' },
]);

upsert('phase_subs', [
  { 親表示順:4, 表示順:1, 日付:'9/5(土)',  期間:'00:00 〜 9/7(月) 23:59' },
  { 親表示順:4, 表示順:2, 日付:'9/10(木)', 期間:'00:00 〜 9/12(土) 23:59' },
  { 親表示順:4, 表示順:3, 日付:'9/15(火)', 期間:'00:00 〜 9/17(木) 23:59' },
  { 親表示順:4, 表示順:4, 日付:'9/20(日)', 期間:'00:00 〜 9/22(火) 23:59', 注記:'5連休と重なります' },
  { 親表示順:4, 表示順:5, 日付:'9/25(金)', 期間:'00:00 〜 9/27(日) 23:59' },
  { 親表示順:4, 表示順:6, 日付:'9/30(水)', 期間:'00:00 〜 SALE終了まで', 注記:'10/1 9:59でSALE終了' },
]);

const plan = (グループ, グループ日付, グループ色, items) =>
  items.map((it, i) => Object.assign({ 区分:'plan', グループ, グループ日付, グループ色, 表示順:i+1 }, it));

upsert('links', [
  ...plan('告知期間', '8/28(金) 10:00 〜', 'b-ann', [
    { アイコン:'🏨', アイコン色:'ic-red',    番号:'LINK ①', タイトル:'ホテル', 割引表記:'最大35%OFF', URL:U.hotel35 },
    { アイコン:'🎢', アイコン色:'ic-orange', 番号:'LINK ②', タイトル:'テーマパーク\n提携ホテル', 割引表記:'最大25%OFF', URL:U.park25 },
    { アイコン:'🏩', アイコン色:'ic-teal',   番号:'LINK ③', タイトル:'チェーンホテル', 割引表記:'最大33%OFF', URL:U.chain33 },
  ]),
  ...plan('先行SALE', '9/1(火) 10:00 〜', 'b-pre', [
    { アイコン:'🏨', アイコン色:'ic-red',    番号:'LINK ④', タイトル:'ホテル', 割引表記:'最大35%OFF', 注記:'一部会員限定', URL:U.hotel35 },
    { アイコン:'🎢', アイコン色:'ic-orange', 番号:'LINK ⑤', タイトル:'テーマパーク\n提携ホテル', 割引表記:'最大25%OFF', URL:U.parkPre },
    { アイコン:'⛓️', アイコン色:'ic-teal',   番号:'LINK ⑥', タイトル:'チェーン\nスペシャルオファー', 割引表記:'最大33%OFF', URL:U.chainPre },
    { アイコン:'🏷️', アイコン色:'ic-gold',   番号:'LINK ⑦', タイトル:'半額プラン', 割引表記:'最大50%OFF', 割引色:'d-gold', 注記:'数量限定', URL:U.half },
  ]),
  ...plan('本番SALE', '9/4(金) 20:00 〜', 'b-main', [
    { アイコン:'🎫', アイコン色:'ic-red',   番号:'LINK ⑧', タイトル:'割引クーポン', 割引表記:'最大4,000円OFF', URL:U.coupon },
    { アイコン:'💰', アイコン色:'ic-blue',  番号:'LINK ⑨', タイトル:'Rakuten\nスーパーDEAL', 割引表記:'高ポイント還元', 割引色:'d-teal', URL:U.deal },
    { アイコン:'⏰', アイコン色:'ic-green', 番号:'LINK ⑩', タイトル:'期間限定プラン', 割引表記:'限定特価', URL:U.limited },
  ]),
]);

upsert('points', [
  { 表示順:1, 番号:'POINT 01', タイトル:'5と0のつく日\n72時間に延長！',
    本文:'今回も<strong>48h → 72h</strong>で開催。SALE期間中に<strong>6回</strong>訪れるので、投稿の山を作りやすいタイミングです。' },
  { 表示順:2, 番号:'POINT 02', タイトル:'遊び・体験', 割引表記:'最大30%OFF',
    本文:'テーマパーク・水族館などのチケットも同時にセール対象。宿とセットで訴求できます。' },
  { 表示順:3, 番号:'POINT 03', タイトル:'テーマパーク\n提携ホテル', 割引表記:'最大25%OFF',
    本文:'告知期間から対象。人気宿は開幕直後に埋まるため、事前の下見訴求が効きます。' },
]);

upsert('campaigns', [
  { 表示順:1, カテゴリ:'国内宿泊', タイトル:'エントリー＆ご旅行で\n最大全額ポイントバック',
    本文:'抽選で<span class="hl">2,500名様</span>に最大全額ポイントバック！\n楽天モバイルご利用で<span class="hl">当選確率2倍</span>に。\n<span style="font-size:.72rem;color:#aaa;">*エントリー必須・金額条件あり・期間限定ポイント</span>' },
]);

upsert('services', [
  { 表示順:1, アイコン:'✈️', 名称:'楽パック（交通＋宿）', 割引表記:'最大30,000円' },
  { 表示順:2, アイコン:'🚗', 名称:'レンタカー', 割引表記:'最大50%OFF' },
  { 表示順:3, アイコン:'🚌', 名称:'高速バス', 割引表記:'最大1,000円' },
  { 表示順:4, アイコン:'🌏', 名称:'海外旅行', 割引表記:'最大50,000円' },
]);
