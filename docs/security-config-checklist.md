# 本番設定チェックリスト（フェーズ 0）

**目的**: ダッシュボード・環境変数の手動設定を漏れなく完了し、**ゲート A**（本番 Stripe 有効化前）→ **ゲート B**（カード課金公開前）を通す。

- コード側（フェーズ 1）: [`security-go-live-plan.md`](./security-go-live-plan.md) — 2026-05-23 反映済み
- 運用の正: [`ops-production.md`](./ops-production.md)
- Stripe 料金・Portal: [`phase3-roadmap.md`](./phase3-roadmap.md)

**使い方**: 各 `[ ]` を完了したら `[x]` に変更。本番 URL を決めたら先頭の「メモ」欄に書いておく。

---

## メモ（作業前に記入）

| 項目 | 値 |
|------|-----|
| 本番アプリ URL（`NEXT_PUBLIC_APP_URL`） | `https://________________` |
| Vercel プロジェクト名 | |
| Supabase プロジェクト ref | |
| Cloudflare R2 バケット名 | |
| だんごツール本番 Origin（`EXTERNAL_CORS_ORIGINS`） | `https://________________` |
| 作業日 / 担当 | |

---

## ゲート A — 本番 Stripe・Auth の土台

### A1. Vercel — Production 環境変数

**場所**: Vercel → Project → Settings → Environment Variables → **Production** のみ（Preview / Development には `sk_live` を入れない）

| [ ] | 変数名 | 確認 |
|-----|--------|------|
| [ ] | `DATABASE_URL` | Supabase **Transaction Pooler**（ポート 6543）、`?sslmode=require` |
| [ ] | `NEXT_PUBLIC_SUPABASE_URL` | 本番 Supabase の URL |
| [ ] | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 公開キー（`NEXT_PUBLIC_` のみ） |
| [ ] | `SUPABASE_SERVICE_ROLE_KEY` | **Production のみ**。クライアントに露出していない |
| [ ] | `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` | 4 つすべて |
| [ ] | `NEXT_PUBLIC_APP_URL` | 本番 URL（末尾スラッシュなし） |
| [ ] | `CRON_SECRET` | 32 文字以上の乱数 |
| [ ] | `UPSTASH_REDIS_REST_URL` | 推奨 — [Upstash Console](https://console.upstash.com/) |
| [ ] | `UPSTASH_REDIS_REST_TOKEN` | 上とセット |
| [ ] | `WEBAUTHN_RP_ID` | 本番ホスト名のみ（例: `your-app.vercel.app`） |
| [ ] | `WEBAUTHN_ORIGIN` | `https://` + 同上ホスト |
| [ ] | `WEBAUTHN_SESSION_SECRET` | 32 文字以上の乱数（または専用 `AUTH_SECRET`） |
| [ ] | `EXTERNAL_CORS_ORIGINS` | だんごツール本番 Origin（カンマ区切り） |
| [ ] | `INTEGRATION_ALLOWED_CLIENT_IDS` | 本番用 client_id |
| [ ] | `INTEGRATION_REDIRECT_ORIGINS` | だんごツール本番 Origin |
| [ ] | `STRIPE_SECRET_KEY` | **`sk_live_`**（テストはローカルのみ `sk_test_`） |
| [ ] | `STRIPE_WEBHOOK_SECRET` | 本番 Webhook の `whsec_`（A3 完了後） |
| [ ] | `STRIPE_PRICE_PRO_MONTHLY` ほか 4 本 | 本番 Price ID |

**検証**

- [ ] デプロイ後 `GET https://<本番>/api/health` → DB・ストレージ等が ok
- [ ] Preview 環境に `sk_live` / `SUPABASE_SERVICE_ROLE_KEY` が無いことを目視確認

参照: [`.env.example`](../.env.example)

---

### A2. Cloudflare R2 — CORS

**場所**: Cloudflare Dashboard → R2 → 対象バケット → Settings → CORS

| [ ] | 設定 | 値の例 |
|-----|------|--------|
| [ ] | AllowedOrigins | `https://<本番アプリ>`（開発時は `http://localhost:3000` を別環境で） |
| [ ] | AllowedMethods | `GET`, `PUT`, `HEAD` |
| [ ] | AllowedHeaders | `Content-Type`（必要なら checksum 系ヘッダを追加 — `.env.example` コメント参照） |
| [ ] | MaxAgeSeconds | `3600` |

**検証**

- [ ] 本番でライブラリからファイルを 1 件アップロード → 成功
- [ ] ブラウザ DevTools → Network で PUT が 403 / CORS エラーにならない

---

### A3. Stripe Dashboard（本番モード）

**場所**: [dashboard.stripe.com](https://dashboard.stripe.com) — 右上が **本番モード**

#### セキュリティ・アカウント

| [ ] | 作業 | 完了の目安 |
|-----|------|------------|
| [ ] | **Settings → Team** — 全メンバーに **2FA 必須**（Authenticator 推奨） | 自分のアカウントで 2FA 有効 |
| [ ] | API キー: **Restricted key** は使う場合のみ必要最小スコープ | 通常は Standard `sk_live` を Vercel のみ |

#### 商品・Price

| [ ] | 作業 |
|-----|------|
| [ ] | Product「だんごシェアリンク Pro」— 月額 / 年額 Price 作成 |
| [ ] | Product「だんごシェアリンク サポーター」— 月額 / 年額 Price 作成 |
| [ ] | 各 Price ID を Vercel の `STRIPE_PRICE_*` にコピー |

料金表: [`phase3-roadmap.md`](./phase3-roadmap.md#料金表想定税込)

#### Webhook

| [ ] | 作業 |
|-----|------|
| [ ] | **Developers → Webhooks → Add endpoint** |
| [ ] | URL: `https://<本番>/api/webhooks/stripe` |
| [ ] | イベント: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` |
| [ ] | 署名シークレット `whsec_` をコピー → Vercel `STRIPE_WEBHOOK_SECRET` |
| [ ] | **Send test webhook** または少額テスト課金で 200・`stripe_webhook_events` に記録 |

#### Radar / 3D Secure（カードテスト対策・申告用）

| [ ] | 作業 |
|-----|------|
| [ ] | **Radar** — 標準ルール有効（本番） |
| [ ] | Checkout で **3D Secure** が要求される設定（カード・リスクに応じて） |
| [ ] | テストカードで Checkout 完了フローを 1 回通す |

申告メモ例: 「決済は Stripe Checkout に委譲。カードテスト対策は Stripe の試行制限・Radar・3DS を利用。」

#### Customer Portal

**場所**: Settings → Billing → Customer portal

| [ ] | 項目 | 推奨 |
|-----|------|------|
| [ ] | 顧客がメールアドレスを更新 | **オン** |
| [ ] | サブスクリプションのプラン切替 | **オン**（Pro ⇄ サポーター） |
| [ ] | 解約 | **期間末**（`cancel_at_period_end` と整合） |

**検証**

- [ ] 本番（またはテスト）で `/settings/billing` → Checkout → 成功 URL 戻り
- [ ] Portal から請求履歴・解約予約が開ける（API 経由 — 実装済み）

---

### A4. Supabase Dashboard（本番プロジェクト）

**場所**: [supabase.com/dashboard](https://supabase.com/dashboard) → 対象プロジェクト

#### URL・Auth 基本

| [ ] | 作業 | 場所 |
|-----|------|------|
| [ ] | **Site URL** = `NEXT_PUBLIC_APP_URL` | Authentication → URL Configuration |
| [ ] | **Redirect URLs** に追加: `https://<本番>/auth/callback` | 同上 |
| [ ] | ローカル用 `http://localhost:3000/auth/callback` は開発プロジェクトまたは追加 URL で維持 | |

#### メール OTP（6 桁コード）

| [ ] | 作業 |
|-----|------|
| [ ] | Authentication → Email Templates → **Magic Link** |
| [ ] | 本文に **`{{ .Token }}`** を含める（リンクだけにしない） |
| [ ] | 本番: Dashboard の Magic Link を `supabase/templates/email-otp.html` と同期（件名・HTML） |
| [ ] | SMTP / Supabase メール送信が本番で有効 |

**ローカル開発**

- メールは実受信箱には届かない。**Mailpit**（`supabase start` 表示の URL、通常 `http://127.0.0.1:54324`）で確認する。
- カスタム HTML は `supabase/config.toml` の `[auth.email.template.magic_link]` → `content_path = "./supabase/templates/email-otp.html"`（CLI はリポジトリルート基準）。変更後は `supabase stop` → `supabase start`。
- メール内ロゴは `{{ .SiteURL }}/apple-touch-icon.png`（`public/apple-touch-icon.png`）。**Site URL** がアプリの URL（本番 `NEXT_PUBLIC_APP_URL`）であること。ローカルは `site_url = "http://127.0.0.1:3000"` と `npm run dev` が必要。

**検証**

- [ ] 本番 `/login` でメール送信 → 6 桁コードが届く
- [ ] コード入力で `/dashboard` に入れる
- [ ] ローカル: Mailpit に件名「【だんごシェアリンク】確認コードのご案内」・ブランド HTML（`email-otp.html`）が届く

#### OAuth（Google / Discord）

| [ ] | 作業 |
|-----|------|
| [ ] | Authentication → Providers → Google / Discord を有効化 |
| [ ] | 各プロバイダのコンソールに **Redirect URI** = Supabase が表示する URL を登録 |
| [ ] | Supabase の Redirect URLs に本番 `auth/callback` がある（A4 上段） |

**検証**

- [ ] 本番で Google または Discord ログインが完了する

#### レート制限・CAPTCHA

| [ ] | 作業 | 推奨値の目安（本番） |
|-----|------|----------------------|
| [ ] | Authentication → Rate Limits を確認 | `sign_in_sign_ups` / `token_verifications` を厳しめ |
| [ ] | `email_sent`（時間あたりメール数） | スパム登録が出ない程度に制限 |
| [ ] | （推奨）**CAPTCHA** — Turnstile または hCaptcha | Authentication → Attack Protection / CAPTCHA |

#### MFA（任意・方針決定）

| [ ] | 決定 |
|-----|------|
| [ ] | クリエイター向け TOTP を **必須にするか** 記録 |
| [ ] | 必須にする場合: Authentication → MFA → TOTP を有効 |

#### キー管理

| [ ] | 作業 |
|-----|------|
| [ ] | `service_role` は Vercel Production のみ。Git・クライアント・だんごツールに載せない |
| [ ] | `anon` / publishable キーのみ `NEXT_PUBLIC_*` |

---

### A5. Upstash Redis（レート制限・推奨）

| [ ] | 作業 |
|-----|------|
| [ ] | [console.upstash.com](https://console.upstash.com/) で DB 作成（リージョンは Vercel に近い場所） |
| [ ] | REST API の URL / Token を Vercel Production に設定 |
| [ ] | 再デプロイ |

**検証**

- [ ] 連携 API を短時間に大量呼び出し → 429（極端な負荷テストは不要、ログで Upstash ヒット確認でも可）
- [ ] Upstash 未設定でもアプリは動く（インメモリ fallback）— 本番は設定推奨

---

## ゲート B — カード課金公開前の最終確認

### B1. アプリ・セキュリティ（フェーズ 1 コード）

| [ ] | 確認 |
|-----|------|
| [ ] | 本番でブラウザコンソールに **CSP エラーが出ない**（`/dashboard`, `/settings/billing`, Checkout 遷移） |
| [ ] | `.exe` 等の禁止ファイルをアップロード → **400** `disallowed_type` |
| [ ] | ログイン失敗時、Supabase の生メッセージ（「User not found」等）が **表示されない** |
| [ ] | レスポンスヘッダに `Content-Security-Policy`, `Strict-Transport-Security` がある |

CSP 調整: [`src/lib/security/headers.ts`](../src/lib/security/headers.ts)

---

### B2. だんごツール連携（使う場合）

| [ ] | 確認 |
|-----|------|
| [ ] | file-share: `EXTERNAL_CORS_ORIGINS` にだんご本番 Origin |
| [ ] | だんご: file-share API ベース URL・連携トークン |
| [ ] | 連携 ON 時は限定配布・共通受付固定（[`ops-production.md`](./ops-production.md)、[`gacha-reception-integration-plan.md`](./gacha-reception-integration-plan.md)） |

---

### B3. Stripe 本番スモーク（少額・実カード or テストモード切替に注意）

| [ ] | 手順 |
|-----|------|
| [ ] | テスト用 workspace で Pro 月額 Checkout 完了 |
| [ ] | Webhook で `plan_tier = pro` になる（DB または `/settings/billing` 表示） |
| [ ] | Customer Portal で解約予約 → 期間末まで Pro のまま |
| [ ] | 必要ならサポーター切替・年額を 1 パターンだけ確認 |

---

## ゲート C 以降（公開後 30 日）— 参照のみ

| [ ] | 作業 | doc |
|-----|------|-----|
| [ ] | OWASP ZAP 等の簡易スキャン＋結果保存 | [`security-go-live-plan.md`](./security-go-live-plan.md) フェーズ 2 |
| [ ] | セキュリティ措置状況申告書の提出 | 下記「申告用メモ」 |

---

## 申告用メモ（Stripe フォーム・コピペ用）

**決済方法**: Stripe Checkout（Hosted）— カード番号は自社サーバ非通過。

| チェックリスト大項目 | 主な所在 |
|----------------------|----------|
| 1 管理者画面 | Stripe Dashboard（2FA・チーム権限）。自社専用管理画面なし |
| 2 ファイル・ディレクトリ | gitignore・R2・`upload-policy.ts` |
| 3 脆弱性 | Drizzle・React・定期診断（ゲート C） |
| 4 ウイルス対策 | 開発 PC・クラウド事業者（Vercel / Cloudflare / Supabase） |
| 5 カードテスト | Stripe Radar・試行制限・3DS |
| 6 不正ログイン | Supabase Auth（OTP・レート制限）＋汎用エラー表示 |

---

## トラブルシュート（よくある）

| 症状 | 確認先 |
|------|--------|
| OTP が届かない | Supabase Email テンプレ・SMTP・`email_sent` レート |
| OAuth リダイレクトエラー | Supabase Redirect URLs・プロバイダ側 URI |
| アップロード CORS 403 | R2 CORS の Origin / AllowedHeaders |
| 課金後も Free のまま | Stripe Webhook URL・`STRIPE_WEBHOOK_SECRET`・イベント購読 |
| CSP で Supabase / R2 がブロック | `headers.ts` の `connect-src` |
| 429 が効かない | `UPSTASH_*` が Production に入っているか・再デプロイ |

---

## 関連リンク

- [セキュリティ導入計画](./security-go-live-plan.md)
- [本番運用](./ops-production.md)
- [Phase 3 Stripe](./phase3-roadmap.md)
- [脅威モデル](./contract-threat-model.md)
