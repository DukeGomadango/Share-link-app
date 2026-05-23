/** 認証失敗時にアカウント存在等を漏らさない汎用メッセージ */

export const AUTH_SEND_CODE_ERROR =
  "メールの送信に失敗しました。入力内容を確認して、しばらくしてからお試しください。";

export const AUTH_VERIFY_LOGIN_ERROR =
  "サインインに失敗しました。コードまたはメールアドレスを確認してください。";

export const AUTH_VERIFY_REGISTER_ERROR =
  "登録に失敗しました。コードまたはメールアドレスを確認してください。";

export function safeAuthSendError(): string {
  return AUTH_SEND_CODE_ERROR;
}

export function safeAuthVerifyError(context: "login" | "register"): string {
  return context === "login" ? AUTH_VERIFY_LOGIN_ERROR : AUTH_VERIFY_REGISTER_ERROR;
}
