export type WebsiteAnalyticsCount = {
  count: number,
  date: Date,
}

export type WebsiteAnalytics = {
  visitors: {
    all: number,
  } & Record<string, number>,
  requests: WebsiteAnalyticsCount[],
  blockedRequests: WebsiteAnalyticsCount[],
}
