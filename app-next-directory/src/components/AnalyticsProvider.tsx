import type { ReactNode } from "react";
import type { StrictComponent } from "@/types";

type AnalyticsProviderProps = {
  children: ReactNode;
};

export const AnalyticsProvider: StrictComponent<AnalyticsProviderProps> = ({ children }) => {
  // Placeholder analytics provider - in production this would integrate with analytics services
  return <>{children}</>;
};
