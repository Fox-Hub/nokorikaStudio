import { defineConfig } from 'astro/config';

// Cloudflare Pages にデプロイする静的サイト構成。
// SSR/Functions が不要な間は output: 'static'（デフォルト）のままでOK。
export default defineConfig({
  site: 'https://nokorikastudio.com',
  // Search Console で登録済みのURL（末尾スラッシュなし）に揃える
  trailingSlash: 'never',
  output: 'static',
});
