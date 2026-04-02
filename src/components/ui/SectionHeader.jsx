export default function SectionHeader({ title, subtitle }) {
  return (
    <div className="ui-section-header">
      <div className="ui-section-header__title">{title}</div>
      {subtitle && (
        <div className="ui-section-header__subtitle">{subtitle}</div>
      )}
    </div>
  );
}
