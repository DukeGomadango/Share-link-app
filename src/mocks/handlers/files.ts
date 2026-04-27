import { http, HttpResponse, delay } from "msw";

export const fileHandlers = [
  http.get("/api/files", async () => {
    await delay(500);
    return HttpResponse.json([
      {
        id: "f1",
        name: "Welcome_Voice_01.mp3",
        type: "audio/mpeg",
        size: 1024 * 500, // 500KB
        createdAt: "2026-04-01T10:00:00Z",
        url: "/mocks/audio1.mp3", // mock url, wouldn't actually play anything unless we create dummy files
        linkedCampaigns: ["Spring Festival Gacha", "Welcome Bonus"],
      },
      {
        id: "f2",
        name: "Special_Illustration_A.png",
        type: "image/png",
        size: 1024 * 1024 * 2.5, // 2.5MB
        createdAt: "2026-04-05T14:30:00Z",
        url: "https://images.unsplash.com/photo-1615672960682-36423223018e?w=800&q=80",
        linkedCampaigns: ["Spring Festival Gacha"],
      },
      {
        id: "f3",
        name: "Secret_Message_B.mp3",
        type: "audio/mpeg",
        size: 1024 * 800, // 800KB
        createdAt: "2026-04-10T09:15:00Z",
        url: "/mocks/audio2.mp3",
        linkedCampaigns: [],
      },
      {
        id: "f4",
        name: "Background_Wallpaper.jpg",
        type: "image/jpeg",
        size: 1024 * 1024 * 4, // 4MB
        createdAt: "2026-04-12T16:45:00Z",
        url: "https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=800&q=80",
        linkedCampaigns: ["Supporter Reward"],
      },
      {
        id: "f5",
        name: "Unused_Asset_Old.png",
        type: "image/png",
        size: 1024 * 1024 * 1.2,
        createdAt: "2026-02-28T11:20:00Z",
        url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80",
        linkedCampaigns: [],
      },
    ]);
  }),

  http.post("/api/files", async () => {
    await delay(1000);
    return HttpResponse.json(
      { success: true, message: "Files uploaded successfully." },
      { status: 201 }
    );
  }),
];
