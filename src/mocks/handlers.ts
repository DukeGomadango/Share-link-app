import { http, HttpResponse } from 'msw';
import { campaignHandlers } from './handlers/campaigns';
import { fileHandlers } from './handlers/files';
import { dashboardOverviewMock } from '@/lib/stats/overview';

export const handlers = [
  http.get('/api/stats/overview', () => {
    return HttpResponse.json(dashboardOverviewMock);
  }),
  ...campaignHandlers,
  ...fileHandlers
];
