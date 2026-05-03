import { http, HttpResponse } from 'msw';

export const mockCampaigns = [
  {
    id: "camp-1",
    name: "春の特別ボイス配布",
    status: "active",
    type: "direct",
    createdAt: "2026-04-15T12:00:00Z",
    stats: { totalFiles: 20, assignedRecipients: 15, openRate: 80.5 },
  },
  {
    id: "camp-2",
    name: "VIPリスナー限定 デジタルブロマイド",
    status: "draft",
    type: "direct",
    createdAt: "2026-04-18T10:00:00Z",
    stats: { totalFiles: 5, assignedRecipients: 0, openRate: 0 },
  },
];

export const campaignHandlers = [
  http.get('/api/campaigns', () => {
    return HttpResponse.json(mockCampaigns);
  }),
  
  http.get('/api/campaigns/:id', ({ params }) => {
    const { id } = params;
    const campaign = mockCampaigns.find(c => c.id === id);
    if (!campaign) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(campaign);
  }),
];
