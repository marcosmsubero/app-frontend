import {
  Card,
  SectionHeader,
  Badge
} from "../components/ui";

export default function ActivityPage() {
  return (
    <div className="page">
      <SectionHeader
        title="Actividad"
        subtitle="Tus entrenamientos"
      />

      <Card compact>
        <h4>Entreno 5km</h4>
        <Badge>Hoy</Badge>
      </Card>

      <Card compact>
        <h4>Series pista</h4>
        <Badge>Ayer</Badge>
      </Card>
    </div>
  );
}
