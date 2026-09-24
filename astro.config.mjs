import { defineConfig } from 'astro/config';

import cloudflare from "@astrojs/cloudflare";

// Cloudflare Pages にデプロイする静的サイト構成。
// SSR/Functions が不要な間は output: 'static'（デフォルト）のままでOK。
// 独自ドメインが決まったら site を設定するとサイトマップ等が正しく生成されます。
export default defineConfig({
  output: "hybrid",
  adapter: cloudflare()
});