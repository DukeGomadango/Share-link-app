/** アップロード予定の objectKey が当該ワークスペース配下か検証する */
export function assertObjectKeyBelongsToWorkspace(
  workspaceId: string,
  objectKey: string,
  assetId: string
): boolean {
  const prefix = `${workspaceId}/${assetId}/`;
  return objectKey.startsWith(prefix) && objectKey.length > prefix.length;
}
