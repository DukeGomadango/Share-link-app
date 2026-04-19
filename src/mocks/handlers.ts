import { http, HttpResponse } from 'msw';
import { campaignHandlers } from './handlers/campaigns';

export const handlers = [
  http.get('/api/stats/overview', () => {
    return HttpResponse.json({
      activeCampaigns: 3,
      totalDistributed: 1542,
      openRate: 86.4
    });
  }),
  ...campaignHandlers
];
