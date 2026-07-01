# calendar-app-site

スマホアプリ（カレンダーアプリ）の事業紹介サイト。Astro（静的サイトジェネレータ）で構築し、Cloudflare Pages にデプロイする想定です。

## 構成

```
src/
  layouts/Layout.astro      共通の<head>・フォント読み込み
  components/Header.astro   ヘッダー（カレンダーの月表示バーを模した意匠）
  components/Footer.astro   フッター
  pages/
    index.astro              トップ（事業概要 / サービス紹介）
    contact.astro             お問い合わせ
    tokushoho.astro           特定商取引法に基づく表記
  styles/global.css          デザイントークン（色・タイポグラフィ）
public/
  favicon.svg
```

## 1. 公開前に必ず編集する項目

事業者名は `Nokorika Studio` で設定済みです。それ以外の【　】で囲った箇所はプレースホルダーなので、実際の情報に差し替えてください。

| ファイル | 内容 |
|---|---|
| `src/pages/index.astro` | 代表者名・所在地・アプリ名 |
| `src/pages/contact.astro` | メールアドレス（`contact@example.com` はダミーです） |
| `src/pages/tokushoho.astro` | 代表者名・所在地・電話番号・対応OS等 |
| `src/pages/privacy.astro` | 制定日、外部解析ツール利用有無、メールアドレス |
| `src/pages/support.astro` | メールアドレス、対応OS、価格体系、データ保存方式 |

特定商取引法の表記は実際の販売形態（アプリ内課金の有無、価格、個人/法人の別）によって文言調整が必要です。不安な場合は専門家への確認をおすすめします。

## 2. ローカルで動かす

Node.js 18 以上が必要です。

```bash
npm install
npm run dev
```

`http://localhost:4321` で確認できます。

## 3. ビルド

```bash
npm run build
```

`dist/` ディレクトリに静的ファイルが出力されます。

## 4. Cloudflare Pages へのデプロイ

最もシンプルなのは GitHub 連携です。

1. このプロジェクトを GitHub リポジトリにプッシュする
2. Cloudflare ダッシュボード → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. リポジトリを選択し、ビルド設定を入力
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. デプロイ後、発行された `*.pages.dev` のURLで公開されます
5. 独自ドメインを使う場合は Pages プロジェクトの **Custom domains** から追加します

`wrangler.toml` は静的サイトのみであれば不要です（Cloudflare Functions を使う場合のみ追加してください）。

CLIから直接デプロイしたい場合は以下でも可能です。

```bash
npm install -g wrangler
npm run build
wrangler pages deploy dist --project-name=calendar-app-site
```

## 5. デザインについて

「カレンダー」という製品そのものをサイトの意匠に転写しています。

- ヒーローはカレンダーグリッドそのもので、当日のマスだけがアクセントカラー（`--accent`）で強調されます（実際の日付に合わせてJSで自動更新）
- 罫線はカレンダーのマス目を思わせるヘアラインのみ。装飾的な要素はほぼ排除しています
- 見出し: Space Grotesk / 本文: Manrope / 日付・ラベル類: JetBrains Mono（Google Fonts経由）

配色やフォントを変更したい場合は `src/styles/global.css` の `:root` 内のトークンを編集してください。

### ダークモード

ヘッダー右上のボタンでライト/ダークを切り替えられます。仕組みは以下の通りです。

- `src/styles/global.css` の `:root[data-theme='dark']` で色トークンを上書き
- `<html>` タグの `data-theme` 属性（`light` / `dark`）で切り替え
- 選択内容は `localStorage` に保存され、次回訪問時も維持されます
- 初回訪問時はOSの配色設定（`prefers-color-scheme`）に従います
- `Layout.astro` 内のインラインスクリプトが描画前にテーマを確定させるため、切り替え時のちらつき（FOUC）はありません

新しいセクションを追加する際は、色は必ず `var(--paper)` `var(--ink)` などのトークン経由で指定してください。直接HEX値を書くとダークモードで反映されません。

### 英語対応（日本語/英語切り替え）

ヘッダー右上の「EN / JA」ボタンで、同一ページ内の表示言語を切り替えられます。

- `src/components/Bi.astro` が日英両方のテキストをDOM上に描画し、CSSの `html[data-lang]` で表示・非表示を切り替える仕組みです
- 使い方: `<Bi ja="日本語テキスト" en="English text" />`
- ページタイトルと `<meta name="description">` は `Layout.astro` の `title` / `titleEn` / `description` / `descriptionEn` props で指定し、JS（`public/scripts/site.js`）が言語切り替え時に書き換えます
- 選択言語も `localStorage` に保存されます

新しいテキストを追加する際は、直接文字列を書かずに `<Bi ja="..." en="..." />` を使うようにしてください。英語訳が未確定の場合は仮訳を入れておき、後で差し替える運用がおすすめです。

## 6. frontend-design プラグインについて

Claude Code で `frontend-design` プラグイン（参考: https://github.com/anthropics/claude-code-frontend-design ）を使う場合、このリポジトリをそのまま開いて追加のセクション作成やデザイン調整を依頼できます。本サイトのデザイントークンは `src/styles/global.css` に集約しているので、プラグイン経由での調整もそこを起点にすると一貫性を保ちやすいです。
