import type { UiBanner } from "../hooks/useProxyController";

interface BannerProps {
  banner: UiBanner;
  testId?: string;
}

export function Banner({ banner, testId = "api-error" }: BannerProps) {
  const tone =
    banner.level === "error"
      ? "banner banner-error"
      : banner.level === "warning"
        ? "banner banner-warning"
        : "banner banner-info";

  return (
    <div className={tone} data-testid={testId}>
      <strong>{banner.code}</strong>
      <span>{banner.message}</span>
    </div>
  );
}
