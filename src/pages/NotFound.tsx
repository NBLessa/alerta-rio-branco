import { Link } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";
import { Header } from "@/components/Header";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto animate-fade-in">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-primary" />
          </div>
          
          <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Página não encontrada
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
