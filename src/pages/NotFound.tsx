import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: rota inexistente:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="text-center">
        <p className="eyebrow">Erro 404</p>
        <h1 className="mt-3 font-display text-4xl">Página não encontrada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          O endereço que você abriu não existe ou foi movido.
        </p>
        <Link to="/" className="mt-6 inline-block text-sm text-primary hover:underline">
          Voltar à página inicial
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
