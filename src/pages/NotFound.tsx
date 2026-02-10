import { Link } from "react-router-dom";
import { Home, MapPin } from "lucide-react";
import { Header } from "@/components/Header";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm mx-auto animate-fade-in">
          {/* Animated icon */}
          <div className="relative w-28 h-28 mx-auto mb-8">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl rotate-6 animate-pulse" />
            <div className="absolute inset-0 bg-primary/5 rounded-3xl -rotate-3" />
            <div className="relative w-full h-full bg-gradient-to-br from-primary/15 to-primary/5 rounded-3xl flex items-center justify-center border border-primary/10">
              <MapPin className="w-14 h-14 text-primary/70 animate-bounce-soft" />
            </div>
          </div>

          <h1 className="text-6xl font-extrabold text-foreground mb-2 tracking-tight">404</h1>
          <p className="text-lg text-muted-foreground mb-2 font-medium">
            Página não encontrada
          </p>
          <p className="text-sm text-muted-foreground/70 mb-8">
            A página que você procura não existe ou foi movida.
          </p>

          <Link
            to="/"
            className="btn-emergency inline-flex"
          >
            <Home className="w-5 h-5" />
            Voltar ao mapa
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
