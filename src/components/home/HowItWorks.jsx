import { useTranslation } from "../../i18n";
import SectionHeading from "./SectionHeading";
import { StepIllustration } from "./illustrations/HomeIllustrations";
import "./HowItWorks.css";

const steps = [
  { title: "Find your hotel", text: "Choose your destination, check-in dates and number of guests to start your hotel search.", art: "luggage" },
  { title: "Choose your room", text: "Compare hotel rooms, nightly prices and guest reviews to find your ideal stay.", art: "beach" },
  { title: "Book & relax", text: "Review your hotel and room details, then get ready for a comfortable stay.", art: "coconut" },
];

export default function HowItWorks() {
  const { t } = useTranslation();
  return (
    <section className="how-it-works container">
      <SectionHeading title={t("How it works")} subtitle={t("Your next hotel stay in three simple steps")} centered />
      <div className="steps-grid">
        {steps.map(step => (
          <article className="travel-step" key={step.title}>
            <StepIllustration variant={step.art} />
            <h3>{t(step.title)}</h3>
            <p>{t(step.text)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
