# ガチャ連携 × 共通受付 — 実装計画（B 方針）

開発者向けの正。ユーザー向け文言はリリース時に [HelpModal.tsx](../../人数カウントアプリ/src/components/HelpModal.tsx)（`/gacha`）を同期する。

## コンセプト

| やりたいこと | やらないこと |
|--------------|--------------|
| 1人1 Claim でセキュアに配布（限定配布・パスキー） | 運営が N 本の個別 URL を手渡しする |
| 会場入口は **受付 QR 1枚**（`/receive/{token}`） | 配布方式の `per_link` を連携の既定にする |
| ガチャは **既存枠に当選ファイルを載せる** | 毎回新規スロット＋`claim_url` 前提の UX |
| 名簿（`recipients`）で人物の SSOT | マージを毎回の正規手順にする |

**配布の2軸を分離する**

- **セキュリティ粒度**: `security_level = high`（変更なし）
- **入口 UX**: `distribution_mode = reception`（連携 ON 時に固定）
- **手渡し用**: `per_link` は連携 OFF のキャンペーンでのみ選択可（既存維持）

---

## エッジケース検証マトリクス

実装前に合意する期待挙動。✅ 問題なし / ⚠️ 許容（運用 or マージ） / 🔧 実装で吸収必須

| # | シナリオ | 期待挙動 | 判定 | 対応フェーズ |
|---|----------|----------|------|--------------|
| E1 | 連携開始後、常連（名簿紐づけ済み）が受付チェックイン | 既存スロット／Claim を再利用。新規スロットを作らない | 🔧 | P1 check-in + P1 POST `recipient_id` |
| E2 | 受付 → ガチャプレイヤー追加（名簿紐づけ）→ 当選 | 同一スロットに `campaign_asset_ids` を載せる | 🔧 | P1 POST |
| E3 | ガチャ当選 → あとから受付（名簿紐づけ済み） | `findClaimForListenerResume` または `recipient_id` で既存 Claim にセッション | 🔧 | P1 check-in |
| E4 | 初来・名簿未紐づけ・受付後にガチャ追加 | **二重枠になりうる** | ⚠️ | 運用＋配布タブ案内。P3 で表示名マッチは任意 |
| E5 | 初来・ガチャのみ（受付なし） | ガチャ枠1つのみ。後から受付で E3 に寄せるか E4 | ⚠️ | 受付 QR 案内を配布タブに表示 |
| E6 | 連携後プレイヤー追加（当選前） | 枠は作られるがファイル0可。受付と二重なら E4 | ⚠️ | 名簿紐づけ推奨 UI |
| E7 | 連携後プレイヤー削除 | **既定 `detach`**: ガチャ冪等キーだけ解除。受付済み Claim／スロットは残す | 🔧 | P1 DELETE |
| E8 | プレイヤー削除（未受付・ガチャ枠のみ） | `purge` または `detach` 後に残 Claim 0 ならスロット削除可 | 🔧 | P1 DELETE |
| E9 | マージ済み（1スロット・Claim複数）後にプレイヤー削除 | ガチャ Claim のみ削除。**スロットは削除しない** | 🔧 | P1 DELETE（現状はスロットごと消える — バグ扱い） |
| E10 | 同一 `recipient_id` を2プレイヤーに紐づけ | 2人目 POST は `409 recipient_slot_conflict` | 🔧 | P1 POST |
| E11 | プレイヤー削除後、同じ人を **新しい playerId** で再追加 | 新 `external_transaction_id` → 新規ガチャ枠。旧枠は `detach` 済み | ✅ | ドキュメントで明記 |
| E12 | `resetPlayer`（履歴リセット） | だんごシェアリンク側は変更しない | ✅ | 現状維持 |
| E13 | リネーム | 既存どおりスロット表示名を追随 | ✅ | 現状維持 |
| E14 | 当選0・未マッピング景品 | fail closed（空 `campaign_asset_ids`） | ✅ | 現状維持 |
| E15 | ツール連携一時停止 | 書き込み 403。受付・閲覧は継続 | ✅ | 現状維持 |
| E16 | 連携 OFF のキャンペーン | `per_link` / `reception` 手動選択可 | ✅ | 連携固定のみ変更 |
| E17 | 受付「ゲスト」 | 名簿自動作成なし。ガチャ側で後から名簿紐づけ可 | ⚠️ | Help に記載 |
| E18 | キャンペーン期限切れ | 既存 claim ルールに追従 | ✅ | 現状維持 |
| E19 | パスキー登録済み + `detach` | Claim 維持、`external_transaction_id` を `recv-{uuid}` に差し替え。ガチャ資産は当選ベースで削除 | 🔧 | P1 DELETE |
| E20 | 既存連携キャンペーン（`per_link` 固定済み） | 連携再開 or 次回 `recipient-slots` POST 時に `reception` へ矯正 + 受付トークン発行 | 🔧 | P1 external-link-mode |

**規模前提（十数〜数十人）**: E4・E5 は ⚠️ として許容。常連は E1–E3 で二重を避ける。

---

## API 仕様（変更後）

### 連携 ON 時のキャンペーン固定

`src/lib/campaigns/external-link-mode.ts`

```ts
securityLevel: "high"
distributionMode: "reception"  // 旧: per_link
status: "active"
```

`patchForEnablingExternalLink()` で `ensurePublicReceptionToken(campaignId)` を呼ぶ。

### `POST .../recipient-slots`

**解決順序**（新規 `resolveSlotForGachaSync()`）:

1. `external_transaction_id` 一致 Claim → 既存冪等更新（現状）
2. `recipient_id` あり → 当該キャンペーンで `campaign_recipient_slots.recipient_id` 一致スロットを1件選択  
   - 複数スロット: `updated_at` 最新（スロットに `updated_at` が無い場合は紐づく Claim の `updated_at` 最大）
   - 既に別の `gacha-*` が付いた Claim がある場合 → `409 recipient_slot_conflict`
3. 新規 `createSlotAndClaim` + `external_transaction_id` 上書き

**既存スロットに載せる場合**

- 原則 **既存 Claim を更新**（受付 Cookie が無効化されないため）
- その Claim の `external_transaction_id` を `gacha-{pool}-player-{id}` に更新（旧 `recv-*` は置換）
- `claim_assets` / `slot_assets` は当選ベースで再計算（現状の冪等更新と同様）

**レスポンス追加フィールド**

| フィールド | 説明 |
|------------|------|
| `delivery_mode` | `"reception"` \| `"per_link"` |
| `reception_url` | `reception` 時。`${base}/receive/{publicReceptionToken}` |
| `claim_url` | `per_link` 時のみ必須。連携＋受付では省略可 |
| `slot_status` | `ready` \| `unlinked` |
| `resolved_existing` | `true` = 新規スロットを作らなかった |

### `DELETE .../recipient-slots?external_transaction_id=&mode=`

| mode | 既定 | 挙動 |
|------|------|------|
| `detach` | ✅ | ガチャ Claim を解除。スロット削除は **残 Claim 数が 0 のときのみ** |
| `purge` | 明示 | ガチャ Claim 削除後、スロットに他 Claim が無ければスロット削除。パスキー紐づきありは `409 slot_in_use` |

**`detach` 詳細（単一 Claim・`gacha-*` のみ）**

1. `claim_assets` を当選同期分クリア（空配列と同様）
2. `external_transaction_id` → `recv-{randomUUID()}`
3. `recomputeSlotAssetsFromClaims`
4. スロットは削除しない

**スロット削除条件（共通）**

```text
remainingClaimsOnSlot(slotId) === 0  →  delete slot
else                                   →  never delete slot
```

### `POST .../check-in`（公開受付）

`createSlotAndClaim` の前に:

1. `findClaimForListenerResume(session, campaignId)` があればその Claim を返し Cookie セット
2. `recipient_id` が分かる場合、当該スロットの Claim を再利用
3. なければ新規作成

---

## 実装フェーズ

### Phase 1 — file-share-app（必須）

| タスク | ファイル |
|--------|----------|
| 連携固定を reception + トークン保証 | `src/lib/campaigns/external-link-mode.ts`, `src/app/api/campaigns/[id]/route.ts` |
| スロット解決ヘルパー | **新規** `src/lib/claims/resolve-slot-for-gacha-sync.ts` |
| POST 統合 | `src/app/api/v1/external/campaigns/[campaignId]/recipient-slots/route.ts` |
| DELETE detach/purge | 同上 |
| チェックイン再利用 | `src/app/api/public/campaigns/[publicToken]/check-in/route.ts` |
| 外部キャンペーン作成 default | `src/app/api/v1/external/campaigns/route.ts` |
| 管理画面: 連携中も受付 URL 表示 | `src/app/(dashboard)/campaigns/[id]/page.tsx` |
| i18n | `src/lib/i18n/locales/ja.ts`, `en.ts` |
| 契約 | `docs/openapi/external-v1.yaml`（`recipient-slots` パス追記） |

**テスト（推奨）**

- `resolve-slot-for-gacha-sync` 単体: E2, E10
- DELETE: E7, E8, E9, E19
- check-in: E1, E3

### Phase 2 — だんごツール（必須）

| タスク | ファイル |
|--------|----------|
| POST レスポンス対応 | `src/lib/gachaDistribution.ts` |
| 成功条件・状態フィールド | `src/lib/gacha.ts`, `useGachaEngine.ts` |
| `deleteExternalSlot` → `mode=detach` | `gachaDistribution.ts`, `useGachaEngine.ts` |
| リンク状態（URL 不要） | `usePlayerLinkStatuses.ts` |
| 配布タブ: 受付 URL 表示 | `GachaDistributionPanel.tsx`, `GachaDistributionHeader.tsx` 等 |
| プレイヤー UI: コピー弱化、準備状態表示 | `GachaPlayerManager.tsx`, `PlayerLinkCollectionModal.tsx` |
| 配布案内 | `GachaDistributionAlerts.tsx` |

### Phase 3 — ドキュメント・リリース

| タスク | ファイル |
|--------|----------|
| 連携 BP 更新 | `人数カウントアプリ/docs/gacha-share-link-integration.md` |
| 運用 | `file-share-app/docs/ops-production.md` |
| チェックリスト | `file-share-app/docs/security-config-checklist.md` |
| 脅威モデル | `file-share-app/docs/contract-threat-model.md` |
| ヘルプ | `人数カウントアプリ/src/components/HelpModal.tsx` |
| LP 履歴 | `人数カウントアプリ/src/lib/lp-changelog.ts`（リリース時） |

### Phase 4 — 任意

- チェックイン時の表示名 ↔ 名簿ファジーマッチ
- 管理画面で「ガチャ由来 / 受付由来」バッジ
- `GET recipient-slots` に `slot_status` / `reception_url` を含める

---

## 推奨運用（リリース後）

1. 常連は **受取人名簿** に登録し、ガチャプレイヤーに **名簿を紐づけ**（イベント前）
2. 会場では **受付 QR のみ** 案内（個別 URL は渡さない）
3. 抽選・配布同期はだんごツール側の通常操作
4. 初来で受取人が二重になったら、だんごシェアリンク管理画面で **マージ**（例外）
5. プレイヤー削除は「ガチャリストから外す」意味（受付済みの受取枠は残る）
6. 誤登録の枠ごと消す必要があるときだけ管理画面から削除 or API `purge`

---

## 受け入れ基準（リグレッション）

- [ ] 連携 ON → `high` + `reception`、受付 URL が取得できる
- [ ] 名簿紐づけ済み: 受付 ↔ ガチャでスロットが増えない（E1–E3）
- [ ] プレイヤー削除（既定）で受付済み Claim が残る（E7, E19）
- [ ] マージ後プレイヤー削除でスロット全体が消えない（E9）
- [ ] 同一 `recipient_id` 二重ガチャ → 409（E10）
- [ ] 冪等 `external_transaction_id` は従来どおり（E14）
- [ ] 連携 OFF キャンペーンは `per_link` 選択可（E16）

---

## 関連

- 現行 BP（移行元）: [gacha-share-link-integration.md](../../人数カウントアプリ/docs/gacha-share-link-integration.md)
- 本番チェック: [ops-production.md](./ops-production.md)
