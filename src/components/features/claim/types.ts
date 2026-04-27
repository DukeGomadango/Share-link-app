export type ClaimFile = {
  id: string;
  type: "image" | "audio";
  src: string;
  filename: string;
  title: string;
  watermarkText?: string;
};

// モックデータ: 受け取るファイルのリスト
export const mockClaimFiles: ClaimFile[] = [
  {
    id: "f1",
    type: "image",
    src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800&auto=format&fit=crop",
    filename: "special_photo_01.jpg",
    title: "Special Photo 01",
    watermarkText: "uid-fana-2026",
  },
  {
    id: "f2",
    type: "audio",
    src: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
    filename: "secret_morning_voice.ogg",
    title: "Secret Morning Voice",
  },
];
