import { Component, ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean }

// Catches render-time crashes so a single broken component can't white-screen
// the whole site for a patient. Logs to the console and, if a global error
// sink exists (e.g. Sentry wired later), forwards to it — no hard dependency.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("UI crash:", error, info.componentStack);
    const sink = (window as unknown as {
      __onError?: (e: Error, stack: string) => void;
    }).__onError;
    if (typeof sink === "function") sink(error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-2xl font-bold text-primary-deep">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sorry for the trouble. Please reload the page. If you were booking
            an appointment, you can also call us directly.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-primary text-white font-semibold px-5 py-2.5 text-sm hover:bg-primary-deep transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
