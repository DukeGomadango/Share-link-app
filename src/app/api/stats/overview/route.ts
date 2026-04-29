import { dashboardOverviewMock } from "@/lib/stats/overview";

export async function GET() {
  return Response.json(dashboardOverviewMock);
}
