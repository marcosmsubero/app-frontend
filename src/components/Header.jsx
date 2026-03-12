import { useAuth } from "../hooks/useAuth";

export default function Header() {
  const { logout } = useAuth();

  return (
    <div className="row header">
      <h3 className="m0">🏃 App Deportes</h3>

      <button onClick={logout}>
        Logout
      </button>
    </div>
  );
}
