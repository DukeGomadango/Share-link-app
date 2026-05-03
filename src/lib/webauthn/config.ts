/** RP ID は公開 URL のホストと一致させる（localhost 開発時は localhost） */
export function getWebAuthnRpConfig(): {
  rpID: string;
  rpName: string;
  origin: string;
} {
  const rpID = process.env.WEBAUTHN_RP_ID?.trim() || "localhost";
  const rpName = process.env.WEBAUTHN_RP_NAME?.trim() || "Dango Share Link";
  const origin =
    process.env.WEBAUTHN_ORIGIN?.trim() || "http://localhost:3000";
  return { rpID, rpName, origin };
}
