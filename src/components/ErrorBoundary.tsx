import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Home, RotateCcw, Phone } from "lucide-react";
import { business } from "@/data/site";

type Props = {
  children: ReactNode;
  resetKey?: string;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("UI ErrorBoundary caught an error:", error, info);
    }
  }

  private handleGoHome = () => {
    this.setState({ hasError: false });
    window.history.pushState(null, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <section className="container-page py-20 sm:py-28">
        <div className="mx-auto max-w-2xl rounded-3xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent-light">
            <AlertTriangle size={24} aria-hidden />
          </div>
          <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold tracking-tight text-primary dark:text-slate-100">
            Etwas ist schiefgelaufen
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink-muted dark:text-slate-400">
            Bei der Anzeige dieser Ansicht ist ein unerwarteter Fehler aufgetreten. Sie können zur Startseite zurückkehren, die Seite neu laden oder uns direkt anrufen.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={this.handleGoHome}
              className="btn-primary w-full sm:w-auto"
            >
              <Home size={16} aria-hidden />
              Zur Startseite
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="btn-ghost w-full sm:w-auto"
            >
              <RotateCcw size={16} aria-hidden />
              Seite neu laden
            </button>
            <a
              href={business.phoneHref}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-accent dark:text-accent-light hover:underline"
            >
              <Phone size={16} aria-hidden />
              {business.phoneDisplay}
            </a>
          </div>
        </div>
      </section>
    );
  }
}
