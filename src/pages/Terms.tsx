import { Header } from '@/components/Header';
import { Shield, AlertTriangle, Camera, Phone, UserX, Scale } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-secondary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Termos de Uso
            </h1>
            <p className="text-muted-foreground">
              Sentinela - Mapa de Alagamentos
            </p>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Finalidade */}
            <section className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Finalidade da Plataforma
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    O Sentinela é uma plataforma colaborativa que permite cidadãos 
                    reportarem pontos de alagamento em Rio Branco, AC, em tempo real. 
                    O objetivo é auxiliar a população a identificar áreas afetadas e 
                    facilitar o acesso à ajuda.
                  </p>
                </div>
              </div>
            </section>

            {/* Responsabilidade */}
            <section className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Scale className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Responsabilidade pelo Envio
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Ao publicar um alerta, você declara que as informações são 
                    verdadeiras. A publicação de informações falsas pode configurar 
                    crime de comunicação falsa de perigo, sujeito a responsabilização 
                    civil e penal conforme a legislação brasileira.
                  </p>
                </div>
              </div>
            </section>

            {/* Privacidade */}
            <section className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Privacidade
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Seu telefone é utilizado apenas para identificação e gerenciamento 
                    de seus alertas. Não divulgamos seu número publicamente. Seu nome 
                    e telefone ficam armazenados de forma segura e não são visíveis 
                    para outros usuários no mapa.
                  </p>
                </div>
              </div>
            </section>

            {/* Fotos */}
            <section className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Camera className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Uso de Fotos
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    As fotos enviadas são utilizadas exclusivamente para comprovação 
                    do evento de alagamento. Ao enviar uma foto, você autoriza sua 
                    exibição pública no mapa para outros usuários verificarem a 
                    situação.
                  </p>
                </div>
              </div>
            </section>

            {/* Proibições */}
            <section className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserX className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Proibições
                  </h2>
                  <ul className="text-muted-foreground space-y-2">
                    <li>• Publicar alertas falsos ou enganosos</li>
                    <li>• Utilizar a plataforma para fins comerciais</li>
                    <li>• Enviar conteúdo ofensivo, violento ou inadequado</li>
                    <li>• Tentar manipular ou sobrecarregar o sistema</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Isenção */}
            <section className="bg-muted/50 rounded-2xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">
                Isenção de Responsabilidade
              </h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                O Sentinela é uma ferramenta colaborativa de apoio à comunidade e 
                <strong className="text-foreground"> não substitui os serviços oficiais </strong> 
                de emergência e defesa civil. Em casos de risco à vida, ligue para o 
                Corpo de Bombeiros (193) ou Defesa Civil (199). Os alertas publicados 
                são de responsabilidade dos usuários que os criaram.
              </p>
            </section>

            {/* Footer */}
            <div className="text-center pt-6 pb-8">
              <p className="text-sm text-muted-foreground">
                Última atualização: Dezembro de 2025
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Terms;
