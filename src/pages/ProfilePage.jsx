import {
  Card,
  SectionHeader,
  Badge,
  InlineAction
} from "../components/ui";

export default function ProfilePage() {
  return (
    <div className="page">
      <SectionHeader
        title="Perfil"
        subtitle="Tu progreso"
      />

      <Card>
        <h3>Marcos</h3>
        <Badge>Runner</Badge>
      </Card>

      <Card>
        <p>42 km esta semana</p>
        <InlineAction>Ver detalle</InlineAction>
      </Card>
    </div>
  );
}
