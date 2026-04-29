export interface DashboardOverviewStats {
  activeCampaigns: number;
  totalDistributed: number;
  openRate: number;
  weeklyViews: number;
  weekOverWeekGrowth: number;
  unassignedAssets: number;
  anomalies: {
    lowOpenRate: boolean;
    noActiveCampaigns: boolean;
  };
}

export const dashboardOverviewMock: DashboardOverviewStats = {
  activeCampaigns: 3,
  totalDistributed: 1542,
  openRate: 86.4,
  weeklyViews: 286,
  weekOverWeekGrowth: 12.8,
  unassignedAssets: 7,
  anomalies: {
    lowOpenRate: false,
    noActiveCampaigns: false,
  },
};
