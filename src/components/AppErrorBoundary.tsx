import { Component, type ErrorInfo, type ReactNode } from "react";
import { PageShellSkeleton } from "@/components/skeletons/AppSkeletons";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  autoRetryCount: number;
}

export class AppErrorBoundary extends Component<Props, State> {
  private retryTimer: number | null = null;

  state: State = {
    hasError: false,
    autoRetryCount: 0,
  };

  static getDerivedStateFromError(): Partial<State> {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[Wotho] Recoverable route/render error:", error, info.componentStack);
    if (this.state.autoRetryCount < 3) {
      if (this.retryTimer) window.clearTimeout(this.retryTimer);
      this.retryTimer = window.setTimeout(() => {
        this.setState((prev) => ({
          hasError: false,
          autoRetryCount: prev.autoRetryCount + 1,
        }));
      }, 150);
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) window.clearTimeout(this.retryTimer);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return <PageShellSkeleton />;
  }
}

export default AppErrorBoundary;
