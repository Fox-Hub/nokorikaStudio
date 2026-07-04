// サイト全体の「リリース状況」を1箇所で管理するファイル。
// ステータスが変わったら、ここを書き換えるだけでヒーローのバッジ等に反映されます。
//
// stage の目安:
//   'development'  - 開発中（機能追加・大きな変更がまだある段階）
//   'pre_release'  - リリース直前の最終調整・審査対応中
//   'released'     - ストアで公開済み
//
// storeUrl は released になったらGoogle PlayのURLを入れてください。
// nullのままだとリンクは表示されません。

export const releaseStatus = {
  stage: 'pre_release',
  ja: '最終調整中 ・ Google Play 近日公開',
  en: 'Final testing underway · Coming soon to Google Play',
  storeUrl: null,
  // 「開発○日目」カウンター表示の起点日（実際の開発開始日に差し替えてください）
  developmentStartDate: '2026-01-15',
};
