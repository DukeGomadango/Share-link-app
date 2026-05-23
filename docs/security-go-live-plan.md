# セキュリティ導入計画（本番課金前）

クレジット取引セキュリティ・チェックリスト（Stripe 申告）と [`phase3-roadmap.md`](./phase3-roadmap.md) の **3c Stripe 本番化** を整合させた作業計画。  
方針: **カード非保持（Checkout）＋委譲（Stripe / Supabase）＋自社で残ったリスクのみ実装**。

## ゴール

| 時点 | 達成状態 |
|------|----------|
| **ゲート A**（本番 `sk_live` 有効化前） | Dashboard 設定完了・Webhook 本番検証・Auth 本番ポリシー確定 |
| **ゲート B**（一般ユーザー向けカード課金公開前） | 下記「フェーズ 1」コード＋ヘッダ＋申告用メモ |
| **ゲート C**（公開後 30 日以内） | フェーズ 2・簡易診断記録 |

「チェックリスト全項目を自社コードに包括実装」は **非目標**。

---

## フェーズ 0 — コード不要（1〜2 日）

運用・申告の土台。担当: 開発者＋Stripe / Supabase Dashboard。

### 0-A Stripe Dashboard（本番）

| # | 作業 | 完了基準 |
|---|------|----------|
| 0-A1 | チームメンバーに **2FA 必須**（Authenticator 推奨） | 全メンバーが TOTP 等で有効 |
| 0-A2 | **本番 Webhook** 登録 → `STRIPE_WEBHOOK_SECRET` を Vercel Production に設定 | `stripe listen` と同イベントで本番 200・冪等確認 |
| 0-A3 | 購読イベント: `checkout.session.completed`, `customer.subscription.*`（既存どおり） | [`phase3-roadmap.md`](./phase3-roadmap.md) と一致 |
| 0-A4 | **Radar / 3D Secure** 方針を決め Dashboard で有効化（標準的な Checkout 向け設定） | テストカードで 3DS フロー確認 |
| 0-A5 | Customer Portal 設定（プラン切替・期間末解約） | ロードマップ「Customer Portal」表と一致 |
| 0-A6 | **申告メモ**用: 「カードテスト対策は Stripe の自動制限＋3DS 等を利用」と 1 文で記録 | 社内 Notion / 本 doc 末尾に追記可 |

参照: [`.env.example`](../.env.example) の Stripe 節。

### 0-B Supabase Dashboard（本番プロジェクト）

| # | 作業 | 完了基準 |
|---|------|----------|
| 0-B1 | **Redirect URLs** に `{NEXT_PUBLIC_APP_URL}/auth/callback` | Google / Discord / メール OTP |
| 0-B2 | Email テンプレートに **`{{ .Token }}`**（6 桁 OTP） | ログイン・登録で OTP が届く |
| 0-B3 | **Auth レート制限**を本番向けに見直し（`sign_in_sign_ups`, `token_verifications`, `email_sent`） | ブルートフォースが現実的に困難 |
| 0-B4 | （推奨）**CAPTCHA**（Turnstile / hCaptcha）を Auth に有効化 | ボット大量登録を抑制 |
| 0-B5 | MFA（TOTP）: **ワークスペース管理者向け必須にするか決定** | 必須なら Dashboard で有効＋将来 UI で案内 |
| 0-B6 | `service_role` キーは **サーバーのみ**（Vercel）、クライアントに載せない | ビルド成果物・`NEXT_PUBLIC_*` に無い |

### 0-C Vercel / インフラ

| # | 作業 | 完了基準 |
|---|------|----------|
| 0-C1 | Production の必須 env を [`ops-production.md`](./ops-production.md) と照合 | `GET /api/health` が期待どおり |
| 0-C2 | `CRON_SECRET`・`STRIPE_*`・`DATABASE_URL` が Production のみ | Preview には live キーを置かない |
| 0-C3 | R2 バケット **CORS**（本番 Origin のみ PUT/GET） | [`.env.example`](../.env.example) のコメントどおり |

### 0-D 申告・組織（コード外）

| # | 作業 |
|---|------|
| 0-D1 | セキュリティ措置状況申告書: 各「はい」の **根拠**（自社 / Stripe / Supabase / Vercel）を表にする |
| 0-D2 | 開発 PC の OS 更新・ウイルス対策（チェックリスト §4 用の運用説明） |

---

## フェーズ 1 — 本番課金公開前に実装（3〜5 日）

ゲート B。コード変更の正は本フェーズ。

### 1-A セキュリティ HTTP ヘッダ

| 項目 | 実装案 | ファイル |
|------|--------|----------|
| `X-Frame-Options` / `X-Content-Type-Options` / `Referrer-Policy` / `Permissions-Policy` | `vercel.json` の `headers` または `next.config.ts` `headers()` | `vercel.json` 推奨（全ルート一律） |
| CSP | **段階導入**: まず `default-src 'self'` + Stripe / Supabase / R2 ドメインを `connect-src` / `frame-src` に明示 | だんご連携時は `EXTERNAL_CORS_ORIGINS` と整合 |
| HSTS | Vercel 本番は HTTPS 強制。必要なら `Strict-Transport-Security` を追加 | |

**受け入れ基準**: 本番で `/dashboard`・`/settings/billing`・Checkout 遷移後にコンソール CSP エラーなし。

**関連**: [`contract-threat-model.md`](./contract-threat-model.md) の CSP 行。

### 1-B アップロード制限（チェックリスト §2）

| 項目 | 内容 |
|------|------|
| MIME / 拡張子ホワイトリスト | 危険な実行系（`.exe`, `.html`, `.svg` 等）を拒否。画像・音声・動画・zip・pdf 等は product 方針でリスト化 |
| 共通関数 | `src/lib/storage/upload-policy.ts`（新規）に集約 |
| 適用箇所 | `POST /api/files/upload-url`, `register`, `api/v1/external/.../upload-url` |

既存: `MAX_UPLOAD_BYTES`, [`sanitize-filename.ts`](../src/lib/storage/sanitize-filename.ts)。

**受け入れ基準**: 拒否 MIME で 400、許可 MIME で署名 URL 発行。

### 1-C 認証まわりの UX（チェックリスト §6）

| 項目 | 内容 |
|------|------|
| エラー文言 | ログイン・OTP 失敗時に「メールが存在しない」等を出さないよう **汎用メッセージ**に統一 |
| 対象 | [`login/page.tsx`](../src/app/(auth)/login/page.tsx), [`register/page.tsx`](../src/app/(auth)/register/page.tsx) |

Supabase 側レート制限はフェーズ 0-B。アプリは **情報漏えいしない表示**のみ。

### 1-D API レート制限の本番化（任意だが推奨）

| 項目 | 現状 | 改善 |
|------|------|------|
| Integration API | インメモリ [`integration-rate-limit.ts`](../src/lib/integration-rate-limit.ts) | 本番は **Upstash Redis** 等に移行（Vercel 多インスタンスで共有） |
| 公開 check-in | 同様 [`check-in-rate-limit.ts`](../src/lib/public/check-in-rate-limit.ts) | 同上 |

**優先度**: 外部連携・受取 URL の乱用が心配なら **ゲート B**。初期ユーザーのみなら **フェーズ 2** でも可。

### 1-E 依存関係・静的チェック

| 項目 | 内容 |
|------|------|
| `npm audit` | CI またはリリース前に high 以上をゼロ化（例外は記録） |
| TypeScript / ESLint | 既存 CI を維持 |

ペンテスト（§3）: 初版は **OWASP ZAP 等の簡易スキャン＋結果メモ**でゲート C までに実施可。

### 1-F ドキュメント同期

| ファイル | 内容 |
|----------|------|
| 本 doc | フェーズ完了日・申告根拠表を更新 |
| [`ops-production.md`](./ops-production.md) | 本番 env・Stripe・Auth のチェック項目を 1 節追加 |
| [`contract-threat-model.md`](./contract-threat-model.md) | CSP・レート制限の実装状態を更新 |

---

## フェーズ 2 — 公開後 30 日以内（2〜3 日）

| # | 作業 | 理由 |
|---|------|------|
| 2-1 | 簡易脆弱性診断（ZAP baseline または依存関係監査の記録） | チェックリスト §3「定期的」の初回証跡 |
| 2-2 | レート制限の Redis 化（1-D を未実施なら） | スケール・多 region |
| 2-3 | 入力バリデーション共通化（Zod 等）を **新規 API から**適用 | 全面リライトは不要 |
| 2-4 | `invoice.payment_failed` の Webhook 方針実装 | [`phase3-roadmap.md`](./phase3-roadmap.md) 技術ルール |

---

## フェーズ 3 — 必要になったら（やらない判断も可）

| 項目 | やる条件 |
|------|----------|
| 専用「運用管理画面」＋ IP 制限 / Basic 認証 | 社内オペ専用 UI を自前で作るとき |
| エンドユーザー TOTP MFA | 規約・ユーザー要望・リスク評価で必須化するとき |
| ログイン通知メール | サポート問い合わせ増への対策として |
| フルペンテスト委託 | 大口 B2B 契約・監査要求時 |
| 不審 IP ブロック（WAF） | 攻撃ログが実際に出たとき（Cloudflare 等） |

---

## スケジュール例（単独開発想定）

| 週 | 内容 |
|----|------|
| **W1 前半** | フェーズ 0 完了（Dashboard・env・申告メモ） |
| **W1 後半** | フェーズ 1-A〜C（ヘッダ・アップロード・Auth UX） |
| **W2 前半** | Stripe 本番テスト課金（少額）・Webhook・Portal 確認 → **ゲート B** |
| **W2 後半〜W4** | フェーズ 2・必要なら 1-D |

Stripe の「システム開発中」申告と整合: **ゲート B までを「導入予定の完了」**、ゲート C を「運用開始後の維持」として記載。

---

## 申告用：対策の所在（テンプレ）

| チェックリスト大項目 | 主な所在 | 自社コード |
|----------------------|----------|------------|
| 1 管理者画面 | **Stripe Dashboard**（2FA・権限） | 専用管理画面なし |
| 2 ディレクトリ・ファイル | gitignore・R2・upload-policy（1-B） | 1-B |
| 3 脆弱性 | Drizzle・React・診断記録（2-1） | 継続開発 |
| 4 ウイルス対策 | 開発 PC・クラウド事業者 | なし |
| 5 カードテスト | **Stripe Radar / 制限** | Checkout のみ |
| 6 不正ログイン | **Supabase Auth**（OTP・レート）＋ 1-C | 1-C |

---

## 実装タスク一覧（Issue 化用）

```
[ ] 0-A Stripe 本番 Webhook + 2FA + Radar/3DS
[ ] 0-B Supabase Auth 本番（OTP テンプレ・レート・CAPTCHA 検討）
[ ] 0-C Vercel Production env 監査（UPSTASH / STRIPE 含む）
[x] 1-A next.config セキュリティヘッダ + CSP — src/lib/security/headers.ts
[x] 1-B upload-policy.ts + upload-url/register + 外部 API
[x] 1-C ログイン/登録の汎用エラーメッセージ — safe-auth-messages.ts
[x] 1-D Upstash 対応（env 未設定時はインメモリ）— sliding-window.ts
[x] 1-E npm audit — CI 既存（ci.yml）
[x] 1-F ops-production / threat-model 更新
[ ] 2-1 簡易診断の実施・記録
[ ] 申告書ドラフト（上表をコピー）
```

**フェーズ 1 コード**: 2026-05-23 反映済み。ゲート B はフェーズ 0（Dashboard）完了後。

---

## 関連ドキュメント

- [`phase3-roadmap.md`](./phase3-roadmap.md) — Stripe 実装・料金
- [`ops-production.md`](./ops-production.md) — 本番 env
- [`contract-threat-model.md`](./contract-threat-model.md) — 外部 API・CORS・CSP
