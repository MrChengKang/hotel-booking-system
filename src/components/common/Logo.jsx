import { useTranslation } from "../../i18n";

export default function Logo() {
  const { t } = useTranslation();
  return (
    <a className="logo" href="/" aria-label={t("STAY home")}>
      <svg viewBox="84 20 84 120" aria-hidden="true">
        <image
          className="logo-original"
          href={`${process.env.PUBLIC_URL}/hotel-logo.png`}
          width="230"
          height="141"
        />
        <image
          className="logo-transparent"
          href={`${process.env.PUBLIC_URL}/hotel-logo-transparent.png`}
          width="230"
          height="141"
        />
      </svg>
      <span>STAY</span>
    </a>
  );
}
