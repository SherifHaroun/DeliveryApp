import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./Button";

type Props = { children: ReactNode; onReset: () => void };
type State = { failed: boolean };

export class ScanErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Scan screen crashed", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <section style={{ textAlign: "center", padding: "32px 8px" }}>
        <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
        <p style={{ color: "var(--muted)", marginBottom: 20 }}>Please try scanning again.</p>
        <Button
          block
          onClick={() => {
            this.setState({ failed: false });
            this.props.onReset();
          }}
        >
          Try Again
        </Button>
      </section>
    );
  }
}
