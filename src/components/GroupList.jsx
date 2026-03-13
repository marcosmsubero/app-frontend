import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState } from "./ui";

function RoleBadge({ role }) {
  const map = {
    owner: "Owner",
    mod: "Admin",
    member: "Miembro",
  };

  return <Badge variant="primary">{map[role] || role || "Miembro"}</Badge>;
}

export default function GroupList({
  isAuthed,
  groups = [],
  loadingGroups,
  onOpenGroup,
}) {
  const safeGroups = Array.isArray(groups) ? groups : [];

  if (loadingGroups) {
    return (
      <div className="groupList">
        <Card>
          <CardBody>
            <p className="muted">Cargando grupos…</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!safeGroups.length) {
    return (
      <div className="groupList">
        <EmptyState
          title="Todavía no hay grupos disponibles"
          description={
            isAuthed
              ? "Cuando se creen nuevos grupos aparecerán aquí para que puedas explorarlos o unirte."
              : "Inicia sesión para descubrir grupos, comunidades y próximos planes."
          }
        />
      </div>
    );
  }

  return (
    <div className="groupList app-stack">
      {!isAuthed ? (
        <Card>
          <CardBody>
            <p className="muted">
              Inicia sesión para ver y unirte a grupos.
            </p>
          </CardBody>
        </Card>
      ) : null}

      <div className="groupList__grid">
        {safeGroups.map((group) => {
          const isMember = !!group.my_role;
          const isPrivate = !!group.is_private;
          const membersCount =
            group.members_count ??
            group.member_count ??
            group.membersCount ??
            group.memberCount ??
            "—";

          const ctaLabel = isMember ? "Entrar al grupo" : isPrivate ? "Solo con invitación" : "Unirme al grupo";

          return (
            <Card
              key={group.id}
              className="groupList__item"
              interactive={!isPrivate}
            >
              <CardHeader className="groupList__header">
                <div className="groupList__top">
                  <div className="groupList__identity">
                    <div className="groupList__nameRow">
                      <CardTitle className="groupList__name">{group.name}</CardTitle>
                      {isMember ? <RoleBadge role={group.my_role} /> : null}
                    </div>

                    <div className="groupList__meta">
                      <span>{group.city || "Ubicación pendiente"}</span>
                      <span>·</span>
                      <span>{group.sport || "Deporte"}</span>
                      <span>·</span>
                      <span>{membersCount} miembros</span>
                    </div>
                  </div>

                  <Badge>{isPrivate ? "Privado" : "Público"}</Badge>
                </div>
              </CardHeader>

              <CardBody className="groupList__actions">
                <Button
                  variant={isPrivate ? "secondary" : isMember ? "secondary" : "primary"}
                  disabled={isPrivate || !onOpenGroup}
                  onClick={() => {
                    if (!isPrivate) onOpenGroup?.(group);
                  }}
                >
                  {ctaLabel}
                </Button>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
