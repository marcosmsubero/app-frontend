import {
  Card,
  Badge,
  Chip,
  SectionHeader,
  InlineAction
} from "../components/ui";

export default function BlaBlaRunPage() {
  return (
    <div className="page">
      <SectionHeader
        title="Eventos"
        subtitle="Descubre grupos y carreras"
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Chip active>Hoy</Chip>
        <Chip>Semana</Chip>
        <Chip>Mes</Chip>
      </div>

      <Card>
        <h3>Running Retiro</h3>
        <Badge variant="primary">5 km</Badge>
        <p>Grupo nivel medio</p>
        <InlineAction>Ver detalles</InlineAction>
      </Card>

      <Card>
        <h3>Series Casa de Campo</h3>
        <Badge>Intervalos</Badge>
        <p>Alta intensidad</p>
        <InlineAction>Unirse</InlineAction>
      </Card>
    </div>
  );
}
