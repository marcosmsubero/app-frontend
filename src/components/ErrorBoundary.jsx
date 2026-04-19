import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // En producción esto podría enviarse a un servicio de monitoreo
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error-boundary">
          <div className="app-error-boundary__inner">
            <h2 className="app-error-boundary__title">
              Algo salió mal
            </h2>
            <p className="app-error-boundary__text">
              Ha ocurrido un error inesperado. Puedes intentar recargar la
              página o volver al inicio.
            </p>

            <div className="app-error-boundary__actions">
              <button
                type="button"
                className="app-button app-button--primary"
                onClick={() => window.location.reload()}
              >
                Recargar página
              </button>

              <button
                type="button"
                className="app-button app-button--secondary"
                onClick={() => {
                  this.handleReset();
                  window.location.href = "/eventos";
                }}
              >
                Ir al inicio
              </button>
            </div>

            {import.meta.env.DEV && this.state.error ? (
              <details className="app-error-boundary__details">
                <summary>Detalles del error (dev)</summary>
                <pre>{String(this.state.error)}</pre>
              </details>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
