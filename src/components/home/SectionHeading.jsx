import "./SectionHeading.css";

export default function SectionHeading({ title, subtitle, centered = false }) {
  return (
    <div className={`section-heading${centered ? " section-heading-centered" : ""}`}>
      <h2>{title}</h2>
      <p className="section-subtitle">{subtitle}</p>
    </div>
  );
}
