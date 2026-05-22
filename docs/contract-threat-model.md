# 契約・脅威モデル（Step A）

外部 API の機械可読契約は [`openapi/external-v1.yaml`](openapi/external-v1.yaml) を正とする。

## Idempotency-Key

- **目的**: `POST /api/v1/external/issue-claims` の同一チャンク再送時に、二重 INSERT を避けつつクライアントへ同一レスポンスを返す。
- **キー空間**: Integration（Bearer が解決する workspace）＋HTTP メソッド＋パス＋ヘッダ値。別ペイロードでキー再利用は禁止。

## スコープ（内部識別子 → 画面文案）

| スコープ       | ユーザー向け説明（例・ja）                         |
|----------------|-----------------------------------------------------|
| `campaigns:read` | キャンペーンとファイル（アセット）の一覧を参照する |
| `campaigns:write` | キャンペーン作成・ファイル登録・ガチャ設定の保存 |
| `claims:issue`   | 受取用リンクを発行する                             |

キャンペーンの **ツール連携一時停止**（`is_external_linked = false`）中は、外部 API の書き込みは `403 integration_paused`。読み取り（GET）は継続可能。

OAuth／連携同意 UI では **アプリ名＋上記の平易文**のみを既定表示とし、機械語は「詳細」折りたたみに限定する。

## ライフサイクル（Claim）

- `issued`: 発行済み・未開封想定。
- `claimed`: 受取処理済み。

キャンペーンが非公開・アーカイブに寄った場合は親の状態に追従（詳細は実装と Help）。

## エラー（外部 API）

| HTTP | 用途 |
|------|------|
| 200  | バッチ本体。行ごとの失敗は `results[].ok=false`。 |
| 400  | JSON 破損・本文として解釈不能な全体エラー。 |
| 401  | Bearer 無効・欠落。 |
| 403  | スコープ不足・他テナントの `campaign_asset_id`。 |
| 429  | レート制限（Step E）。 |

枯渇 409 は Phase 1 非採用（在庫モデルなし）。

## 脅威モデル（要点）

- **ブラウザに置く Bearer／連携トークン**: XSS 時に露出する。だんご側はローカルのみ保管とし、file-share は revoke とローテーション手段を提供する。
- **CORS**: だんごオリジンからの `Authorization` 付きリクエストを明示許可（Step E）。
- **CSP**: だんご側 `connect-src` に file-share API オリジンを追加（統合フェーズ）。
- **乱発**: Integration 単位レートを主軸、IP は緩い上限（Step E）。

## 実装メモ（Step E・file-share のみ）

| 項目 | 内容 |
|------|------|
| 認証 | `Authorization: Bearer` → `integration_access_tokens.token_hash` に一致する行（SHA-256） |
| CORS | `EXTERNAL_CORS_ORIGINS`（カンマ区切り）。未設定時は開発用 localhost 系のみ |
| Idempotency | `integration_idempotency_keys` に JSON レスポンスを保存。キーは `(integration_token_id, route_key, idempotency_key_hash)` |
| エンドポイント | `GET /api/v1/external/campaigns`、`GET /api/v1/external/campaigns/:campaignId/assets`、`POST /api/v1/external/issue-claims` |
| 429 / レート | 本リポの Phase 1 では未実装（KV 等で後付け可能） |
