import type { StrictComponent } from "@/types";

export const AnalyticsProvider: StrictComponent = ({ children }) => {
  // Placeholder analytics provider - in production this would integrate with analytics services
  return <>{children}</>;
};
