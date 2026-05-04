export type ClaimFile = {
  id: string;
  type: "image" | "audio" | "file";
  src: string;
  filename: string;
  title: string;
};
