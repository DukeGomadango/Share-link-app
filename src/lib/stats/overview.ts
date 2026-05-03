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
