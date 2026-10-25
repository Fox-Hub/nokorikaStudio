import { defineConfig } from 'astro/config';

// Cloudflare Pages にデプロイする静的サイト構成。
// SSR/Functions が不要な間は output: 'static'（デフォルト）のままでOK。
export default defineConfig({
  site: 'https://nokorikastudio.com',
  // Cloudflare Pages はディレクトリを末尾スラッシュ付きで配信するため揃える
  trailingSlash: 'always',
  output: 'static',
});
