// サイト全体の「リリース状況」を1箇所で管理するファイル。
// ステータスが変わったら、ここを書き換えるだけでヒーローのバッジ等に反映されます。
//
// stage の目安:
//   'development'  - 開発中（機能追加・大きな変更がまだある段階）
//   'pre_release'  - リリース直前の最終調整・審査対応中
//   'released'     - ストアで公開済み
//
// storeUrl / appStoreUrl は公開後に各ストアのURLを入れてください。
// nullのままだとリンクは表示されません。

export const releaseStatus = {
  stage: 'released',
  ja: 'Google Play で公開中 ・ App Store 審査中',
  en: 'Available on Google Play · App Store under review',
  storeUrl: 'https://play.google.com/store/apps/details?id=com.nokorikastudio.nokorika',
  // App Store 公開後にURLを入れる（審査中は null のまま）
  appStoreUrl: null,
  // 「開発○日目」カウンター表示の起点日（実際の開発開始日に差し替えてください）
  developmentStartDate: '2026-08-15',
};
