import { Component, type ErrorInfo, type ReactNode } from "react";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isOfflineError: boolean;
}

function isNetworkOrChunkError(error: unknown): boolean {
  const msg = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "");
  return (
    (typeof navigator !== "undefined" && navigator.onLine === false) ||
    /ChunkLoadError|Loading chunk|Failed to fetch|dynamically imported module|NetworkError|Load failed/i.test(msg)
  );
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    isOfflineError: false,
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      isOfflineError: isNetworkOrChunkError(error),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Wotho] Route or render error:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, isOfflineError: false });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, isOfflineError: false });
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const offline =
      this.state.isOfflineError || (typeof navigator !== "undefined" && navigator.onLine === false);

    return (
      <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-zinc-950/90 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10">
            <WifiOff className="h-5 w-5 text-zinc-300" />
          </div>
          <h1 className="text-xl font-normal tracking-tight text-white mb-2">
            {offline ? "Sem conexão com a internet" : "Não foi possível carregar esta página"}
          </h1>
          <p className="text-sm font-light text-zinc-400 leading-relaxed mb-7">
            {offline
              ? "A sua conexão caiu durante o carregamento. Assim que a internet voltar, clique abaixo para continuar de onde parou."
              : "Ocorreu uma falha temporária ao processar este conteúdo. Tente recarregar a página."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={this.handleRetry}
              className="rounded-full px-6 text-[11px] uppercase tracking-wider font-normal"
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Tentar novamente
            </Button>
            <Button
              variant="outline"
              onClick={this.handleGoHome}
              className="rounded-full px-6 text-[11px] uppercase tracking-wider font-normal border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              <Home className="mr-2 h-3.5 w-3.5" />
              Voltar ao início
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
