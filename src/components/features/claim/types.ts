export type ClaimFile = {
  id: string;
  type: "image" | "audio";
  src: string;
  filename: string;
  title: string;
  watermarkText?: string;
};
