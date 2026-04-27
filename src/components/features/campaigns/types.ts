export type FileItem = {
  id: string;
  name: string;
  type: "audio" | "image";
  previewUrl?: string;
};

export type Recipient = {
  id: string;
  name: string;
  email: string;
  assignedFileIds: string[];
  link?: string;
};
