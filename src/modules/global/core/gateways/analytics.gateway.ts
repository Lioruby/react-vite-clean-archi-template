export interface IAnalyticsGateway {
  track(event: string, properties?: Record<string, unknown>): void;
}
