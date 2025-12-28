import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, MapPin, Camera, FileCheck, Send, 
  ChevronLeft, ChevronRight, AlertTriangle, Check,
  Loader2, X, Navigation, Search
} from 'lucide-react';
import { 
  formatPhoneE164, 
  formatPhoneDisplay, 
  isWithinBounds,
  RIO_BRANCO_BOUNDS 
} from '@/types/alert';
import { 
  createOrGetUser, 
  createAlert, 
  getCurrentUser,
  countActiveAlertsByUser,
  hasNearbyActiveAlert
} from '@/store/alertStore';
import { toast } from 'sonner';

type WizardStep = 'cadastro' | 'pergunta' | 'local' | 'evidencia' | 'termo' | 'enviar';

interface FormData {
  fullName: string;
  phone: string;
  street: string;
  number: string;
  neighborhood: string;
  lat: number;
  lng: number;
  useCurrentLocation: boolean;
  isFlooding: boolean | null;
  photos: string[];
  notes: string;
  acceptedTerms: boolean;
}

export function ReportWizard() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const existingUser = getCurrentUser();
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('cadastro');
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [createdAlertId, setCreatedAlertId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    fullName: existingUser?.fullName || '',
    phone: existingUser?.phone ? formatPhoneDisplay(existingUser.phone) : '',
    street: '',
    number: '',
    neighborhood: '',
    lat: existingUser?.defaultLat || RIO_BRANCO_BOUNDS.center.lat,
    lng: existingUser?.defaultLng || RIO_BRANCO_BOUNDS.center.lng,
    useCurrentLocation: false,
    isFlooding: null,
    photos: [],
    notes: '',
    acceptedTerms: false,
  });

  const steps: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
    { id: 'cadastro', label: 'Cadastro', icon: <User className="w-5 h-5" /> },
    { id: 'pergunta', label: 'Situação', icon: <AlertTriangle className="w-5 h-5" /> },
    { id: 'local', label: 'Local', icon: <MapPin className="w-5 h-5" /> },
    { id: 'evidencia', label: 'Fotos', icon: <Camera className="w-5 h-5" /> },
    { id: 'termo', label: 'Termo', icon: <FileCheck className="w-5 h-5" /> },
    { id: 'enviar', label: 'Enviar', icon: <Send className="w-5 h-5" /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (!isWithinBounds(latitude, longitude)) {
          toast.error('Localização fora de Rio Branco, AC');
          setIsLoading(false);
          return;
        }

        updateFormData({
          lat: latitude,
          lng: longitude,
          useCurrentLocation: true,
        });
        toast.success('Localização obtida!');
        setIsLoading(false);
      },
      (error) => {
        toast.error('Erro ao obter localização');
        setIsLoading(false);
      }
    );
  }, []);

  const geocodeAddress = useCallback(async () => {
    setIsLoading(true);
    
    // Rio Branco bounding box for restricted search
    const viewbox = '-68.05,-10.10,-67.70,-9.85';
    
    // Try multiple search strategies
    const searchQueries = [
      // Strategy 1: Street with neighborhood
      `${formData.street}, ${formData.neighborhood}, Rio Branco`,
      // Strategy 2: Just street name in Rio Branco
      `${formData.street}, Rio Branco, Acre`,
      // Strategy 3: Neighborhood only
      `${formData.neighborhood}, Rio Branco, Acre`,
    ];
    
    try {
      for (const query of searchQueries) {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('format', 'json');
        url.searchParams.set('q', query);
        url.searchParams.set('limit', '1');
        url.searchParams.set('viewbox', viewbox);
        url.searchParams.set('bounded', '1');
        url.searchParams.set('countrycodes', 'br');
        
        const response = await fetch(url.toString(), {
          headers: {
            'Accept-Language': 'pt-BR',
          }
        });
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const latitude = parseFloat(lat);
          const longitude = parseFloat(lon);
          
          if (isWithinBounds(latitude, longitude)) {
            updateFormData({
              lat: latitude,
              lng: longitude,
            });
            toast.success('Endereço localizado no mapa!');
            setIsLoading(false);
            return;
          }
        }
      }
      
      // If no results, use neighborhood center or default
      toast.warning('Endereço não encontrado. Por favor, use o GPS para localização precisa.');
    } catch (error) {
      toast.error('Erro ao buscar endereço. Use o GPS.');
    } finally {
      setIsLoading(false);
    }
  }, [formData.street, formData.neighborhood]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxPhotos = 3;
    const remainingSlots = maxPhotos - formData.photos.length;
    
    if (remainingSlots <= 0) {
      toast.error('Máximo de 3 fotos');
      return;
    }

    Array.from(files).slice(0, remainingSlots).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        updateFormData({
          photos: [...formData.photos, result],
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    updateFormData({
      photos: formData.photos.filter((_, i) => i !== index),
    });
  };

  const getFullAddress = (): string => {
    const parts = [];
    if (formData.street.trim()) parts.push(formData.street.trim());
    if (formData.number.trim()) parts.push(formData.number.trim());
    if (formData.neighborhood.trim()) parts.push(`- ${formData.neighborhood.trim()}`);
    return parts.join(', ');
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 'cadastro':
        if (!formData.fullName.trim()) {
          toast.error('Digite seu nome completo');
          return false;
        }
        if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 10) {
          toast.error('Digite um telefone válido');
          return false;
        }
        if (!formData.street.trim()) {
          toast.error('Digite o nome da rua');
          return false;
        }
        if (!formData.neighborhood.trim()) {
          toast.error('Digite o bairro');
          return false;
        }
        return true;

      case 'pergunta':
        if (formData.isFlooding === null) {
          toast.error('Responda se está alagado');
          return false;
        }
        return true;

      case 'local':
        if (!isWithinBounds(formData.lat, formData.lng)) {
          toast.error('Localização deve estar em Rio Branco, AC');
          return false;
        }
        return true;

      case 'evidencia':
        if (formData.photos.length === 0) {
          toast.error('Adicione pelo menos 1 foto');
          return false;
        }
        return true;

      case 'termo':
        if (!formData.acceptedTerms) {
          toast.error('Aceite os termos para continuar');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (currentStep === 'pergunta' && !formData.isFlooding) {
      toast.info('Use o mapa para acompanhar alertas ativos');
      navigate('/');
      return;
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsLoading(true);

    try {
      // Create or get user
      const fullAddress = getFullAddress();
      const user = createOrGetUser({
        fullName: formData.fullName,
        phone: formatPhoneE164(formData.phone),
        addressText: fullAddress,
        lat: formData.lat,
        lng: formData.lng,
      });

      setUserToken(user.token);

      // Check limits
      const activeCount = countActiveAlertsByUser(user.id);
      if (activeCount >= 3) {
        toast.error('Você já tem 3 alertas ativos. Encerre um antes de criar outro.');
        setIsLoading(false);
        return;
      }

      // Check nearby alerts
      const nearbyAlert = hasNearbyActiveAlert(user.id, formData.lat, formData.lng);
      if (nearbyAlert) {
        toast.warning('Você já tem um alerta ativo próximo. Considere atualizá-lo.');
      }

      // Create alert
      const alert = createAlert({
        userId: user.id,
        addressText: fullAddress,
        neighborhood: formData.neighborhood || undefined,
        lat: formData.lat,
        lng: formData.lng,
        notes: formData.notes || undefined,
        photos: formData.photos,
      });

      setCreatedAlertId(alert.id);
      toast.success('Alerta publicado no mapa!');
      
      // Move to success state
      setCurrentStep('enviar');
    } catch (error) {
      toast.error('Erro ao criar alerta');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'cadastro':
        return (
          <div className="space-y-4 animate-fade-in">
            <h2 className="section-title">Seus dados</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Precisamos de seus dados para gerenciar o alerta
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome completo *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateFormData({ fullName: e.target.value })}
                  placeholder="Digite seu nome"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData({ phone: e.target.value })}
                  placeholder="(68) 99999-9999"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Rua *
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => updateFormData({ street: e.target.value })}
                  placeholder="Ex: Av. Ceará"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Número
                  </label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => updateFormData({ number: e.target.value })}
                    placeholder="Ex: 1500"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => updateFormData({ neighborhood: e.target.value })}
                    placeholder="Ex: Centro"
                    className="input-field"
                  />
                </div>
              </div>
              
              <button
                onClick={handleGetLocation}
                disabled={isLoading}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Navigation className="w-4 h-4" />
                Usar minha localização atual
              </button>
            </div>
          </div>
        );

      case 'pergunta':
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="section-title text-center">Você está alagado agora?</h2>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  updateFormData({ isFlooding: true });
                  handleNext();
                }}
                className="btn-emergency py-6 text-xl"
              >
                <AlertTriangle className="w-6 h-6" />
                Sim, estou alagado
              </button>

              <button
                onClick={() => {
                  updateFormData({ isFlooding: false });
                  toast.info('Use o mapa para acompanhar alertas ativos');
                  navigate('/');
                }}
                className="btn-secondary py-6 text-xl"
              >
                Não
              </button>
            </div>
          </div>
        );

      case 'local':
        return (
          <div className="space-y-4 animate-fade-in">
            <h2 className="section-title">Local do alagamento</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Rua do alagamento *
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => updateFormData({ street: e.target.value })}
                  placeholder="Ex: Av. Ceará"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Número
                  </label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => updateFormData({ number: e.target.value })}
                    placeholder="Ex: 1500"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => updateFormData({ neighborhood: e.target.value })}
                    placeholder="Ex: Centro"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Mini Map Placeholder */}
              <div className="relative h-48 bg-muted rounded-xl border border-border overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `
                      linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                      linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
                    `,
                    backgroundSize: '30px 30px',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-10 h-10 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Lat: {formData.lat.toFixed(4)}, Lng: {formData.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={geocodeAddress}
                  disabled={isLoading || !formData.street.trim() || !formData.neighborhood.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:brightness-110 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  Buscar endereço
                </button>
                <button
                  onClick={handleGetLocation}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:brightness-110"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Navigation className="w-5 h-5" />
                  )}
                  GPS
                </button>
              </div>

              {formData.useCurrentLocation && (
                <p className="text-sm text-success flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Localização obtida via GPS
                </p>
              )}

              {!isWithinBounds(formData.lat, formData.lng) && (
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Localização fora de Rio Branco, AC
                </p>
              )}
            </div>
          </div>
        );

      case 'evidencia':
        return (
          <div className="space-y-4 animate-fade-in">
            <h2 className="section-title">Fotos do alagamento</h2>
            <p className="text-sm text-muted-foreground">
              Adicione 1 a 3 fotos como evidência (obrigatório)
            </p>

            {/* Photo Grid */}
            <div className="grid grid-cols-3 gap-3">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative aspect-square">
                  <img 
                    src={photo} 
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl border border-border"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {formData.photos.length < 3 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Camera className="w-8 h-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Adicionar</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {formData.photos.length === 0 && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Sem foto, não publicamos no mapa
              </p>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Observação (opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateFormData({ notes: e.target.value })}
                placeholder="Descreva a situação brevemente..."
                rows={3}
                maxLength={200}
                className="input-field resize-none"
              />
              <p className="text-xs text-muted-foreground text-right mt-1">
                {formData.notes.length}/200
              </p>
            </div>
          </div>
        );

      case 'termo':
        return (
          <div className="space-y-4 animate-fade-in">
            <h2 className="section-title">Termo de Responsabilidade</h2>

            <div className="bg-muted/50 p-4 rounded-xl border border-border">
              <p className="text-sm text-foreground leading-relaxed">
                Ao publicar este alerta, declaro que as informações são verdadeiras 
                e entendo que comunicação falsa pode gerar responsabilização civil 
                e penal conforme a legislação aplicável.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.acceptedTerms}
                onChange={(e) => updateFormData({ acceptedTerms: e.target.checked })}
                className="w-5 h-5 mt-0.5 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">
                Li e aceito os{' '}
                <a href="/termos" target="_blank" className="text-primary underline">
                  termos de uso
                </a>
              </span>
            </label>
          </div>
        );

      case 'enviar':
        if (createdAlertId) {
          // Success state
          return (
            <div className="space-y-6 animate-fade-in text-center">
              <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-success" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Alerta publicado!
                </h2>
                <p className="text-muted-foreground">
                  Seu alerta já está visível no mapa
                </p>
              </div>

              {userToken && (
                <div className="bg-muted p-4 rounded-xl border border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    Seu Código Sentinela:
                  </p>
                  <p className="text-2xl font-mono font-bold text-primary">
                    {userToken}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Salve este código para gerenciar seus alertas
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/')}
                  className="btn-emergency"
                >
                  <MapPin className="w-5 h-5" />
                  Ver no mapa
                </button>

                <button
                  onClick={() => navigate('/meus-alertas')}
                  className="btn-secondary"
                >
                  Gerenciar meus alertas
                </button>
              </div>
            </div>
          );
        }

        // Confirm submit state
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="section-title">Confirmar envio</h2>

            <div className="bg-muted/50 p-4 rounded-xl border border-border space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{getFullAddress()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-primary" />
                <p className="text-sm">{formData.photos.length} foto(s) anexada(s)</p>
              </div>

              {formData.notes && (
                <div className="flex items-start gap-3">
                  <FileCheck className="w-5 h-5 text-primary mt-0.5" />
                  <p className="text-sm text-muted-foreground">{formData.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn-emergency w-full"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Publicar alerta no mapa
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Steps */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex flex-col items-center gap-1 ${
                index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${index < currentStepIndex ? 'bg-primary text-primary-foreground' : ''}
                ${index === currentStepIndex ? 'bg-primary/20 text-primary ring-2 ring-primary' : ''}
                ${index > currentStepIndex ? 'bg-muted text-muted-foreground' : ''}
              `}>
                {index < currentStepIndex ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>
              <span className="text-[10px] font-medium hidden sm:block">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-md mx-auto">
          {renderStepContent()}
        </div>
      </div>

      {/* Navigation */}
      {!['enviar', 'pergunta'].includes(currentStep) && (
        <div className="border-t border-border bg-card p-4">
          <div className="flex gap-3 max-w-md mx-auto">
            {currentStepIndex > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80"
              >
                <ChevronLeft className="w-5 h-5" />
                Voltar
              </button>
            )}

            <button
              onClick={currentStep === 'termo' ? handleSubmit : handleNext}
              disabled={isLoading}
              className="flex-1 btn-emergency"
            >
              {currentStep === 'termo' ? 'Enviar' : 'Continuar'}
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
