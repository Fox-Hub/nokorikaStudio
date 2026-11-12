import { releaseStatus as nokorikaStatus, koecareReleaseStatus } from './status.js';

// ホームのアプリ一覧などで使うカタログ。
// 個別ページの詳細コピーは各 apps/*.astro 側に置く。

export const apps = [
  {
    id: 'nokorika',
    href: '/apps/nokorika/',
    name: 'Nokorika',
    nameJa: 'ノコリカ',
    category: { ja: 'カレンダー', en: 'Calendar' },
    summary: {
      ja: '月・週表示で予定をシンプルに管理できるカレンダーアプリ。Google Play・App Store で公開中。',
      en: 'A simple calendar app with month and week views. Available on Google Play and the App Store.',
    },
    status: {
      stage: nokorikaStatus.stage,
      ja: nokorikaStatus.ja,
      en: nokorikaStatus.en,
      storeUrl: nokorikaStatus.storeUrl,
      appStoreUrl: nokorikaStatus.appStoreUrl,
    },
  },
  {
    id: 'koecare',
    href: '/apps/koecare/',
    name: 'KoeCare',
    nameJa: 'KoeCare',
    category: { ja: '騒音計測', en: 'Noise meter' },
    summary: {
      ja: '身のまわりの音を計測し、わかりやすく把握するための騒音計測アプリ。Google Play で公開中。',
      en: 'A noise meter app that helps you measure and understand everyday sound levels. Available on Google Play.',
    },
    status: {
      stage: koecareReleaseStatus.stage,
      ja: koecareReleaseStatus.ja,
      en: koecareReleaseStatus.en,
      storeUrl: koecareReleaseStatus.storeUrl,
      appStoreUrl: koecareReleaseStatus.appStoreUrl,
    },
  },
];
