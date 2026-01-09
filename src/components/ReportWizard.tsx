import { useState, useRef, useCallback, useEffect } from 'react';
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
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

interface ExistingUser {
  id: string;
  fullName: string;
  phone: string;
  defaultAddressText?: string;
  defaultLat?: number;
  defaultLng?: number;
}

export function ReportWizard() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [existingUser, setExistingUser] = useState<ExistingUser | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>('cadastro');
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [createdAlertId, setCreatedAlertId] = useState<string | null>(null);
  
  const [addressSearched, setAddressSearched] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    street: '',
    number: '',
    neighborhood: '',
    lat: RIO_BRANCO_BOUNDS.center.lat,
    lng: RIO_BRANCO_BOUNDS.center.lng,
    useCurrentLocation: false,
    isFlooding: null,
    photos: [],
    notes: '',
    acceptedTerms: false,
  });

  // Load existing user from localStorage (for continuity)
  useEffect(() => {
    const storedUser = localStorage.getItem('sentinela_current_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setExistingUser({
          id: parsed.id,
          fullName: parsed.fullName,
          phone: parsed.phone,
          defaultAddressText: parsed.defaultAddressText,
          defaultLat: parsed.defaultLat,
          defaultLng: parsed.defaultLng,
        });
        setFormData(prev => ({
          ...prev,
          fullName: parsed.fullName || '',
          phone: parsed.phone ? formatPhoneDisplay(parsed.phone) : '',
          lat: parsed.defaultLat || RIO_BRANCO_BOUNDS.center.lat,
          lng: parsed.defaultLng || RIO_BRANCO_BOUNDS.center.lng,
        }));
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
  }, []);

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
        setAddressSearched(true);
        toast.success('Localização obtida!');
        setIsLoading(false);
      },
      (error) => {
        toast.error('Erro ao obter localização');
        setIsLoading(false);
      }
    );
  }, []);

  const geocodeAddress = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Build address string
      const addressParts = [formData.street];
      if (formData.number.trim()) {
        addressParts.push(formData.number);
      }
      addressParts.push(formData.neighborhood);
      const address = addressParts.join(', ');
      
      console.log('Geocoding address:', address);
      
      const { data, error } = await supabase.functions.invoke('geocode', {
        body: { address }
      });
      
      if (error) {
        console.error('Geocode error:', error);
        toast.error('Erro ao buscar endereço. Use o GPS.');
        return false;
      }
      
      if (data.success) {
        updateFormData({
          lat: data.lat,
          lng: data.lng,
        });
        setAddressSearched(true);
        toast.success(`Endereço localizado: ${data.formattedAddress}`);
        return true;
      } else {
        toast.warning(data.error || 'Endereço não encontrado. Use o GPS.');
        return false;
      }
    } catch (error) {
      console.error('Geocode error:', error);
      toast.error('Erro ao buscar endereço. Use o GPS.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [formData.street, formData.number, formData.neighborhood]);

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

  const handleNext = async () => {
    if (!validateStep()) return;

    if (currentStep === 'pergunta' && !formData.isFlooding) {
      toast.info('Use o mapa para acompanhar alertas ativos');
      navigate('/');
      return;
    }

    // Auto-trigger address search on 'local' step if not done yet
    if (currentStep === 'local' && !addressSearched) {
      if (!formData.street.trim() || !formData.neighborhood.trim()) {
        toast.error('Preencha rua e bairro para buscar o endereço');
        return;
      }
      const success = await geocodeAddress();
      if (!success) return;
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
      const fullAddress = getFullAddress();
      const phoneE164 = formatPhoneE164(formData.phone);
      
      // First, create or get user in Supabase
      let userId: string;
      let token: string;
      
      // Check if user exists by phone
      const { data: existingUsers } = await supabase
        .from('sentinela_users')
        .select('*')
        .eq('phone', phoneE164)
        .limit(1);
      
      if (existingUsers && existingUsers.length > 0) {
        // Update existing user
        const existingUser = existingUsers[0];
        userId = existingUser.id;
        token = existingUser.token;
        
        await supabase
          .from('sentinela_users')
          .update({
            full_name: formData.fullName,
            default_address_text: fullAddress,
            default_lat: formData.lat,
            default_lng: formData.lng,
          })
          .eq('id', userId);
      } else {
        // Create new user
        token = crypto.randomUUID().slice(0, 8).toUpperCase();
        const { data: newUser, error: userError } = await supabase
          .from('sentinela_users')
          .insert({
            full_name: formData.fullName,
            phone: phoneE164,
            token: token,
            default_address_text: fullAddress,
            default_lat: formData.lat,
            default_lng: formData.lng,
          })
          .select()
          .single();
        
        if (userError) throw userError;
        userId = newUser.id;
      }
      
      setUserToken(token);
      
      // Check active alerts count for this user
      const { count: activeCount } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'ACTIVE');
      
      if (activeCount && activeCount >= 3) {
        toast.error('Você já tem 3 alertas ativos. Encerre um antes de criar outro.');
        setIsLoading(false);
        return;
      }
      
      // Create the alert
      const { data: newAlert, error: alertError } = await supabase
        .from('alerts')
        .insert({
          user_id: userId,
          address_text: fullAddress,
          neighborhood: formData.neighborhood || null,
          lat: formData.lat,
          lng: formData.lng,
          notes: formData.notes || null,
        })
        .select()
        .single();
      
      if (alertError) throw alertError;
      
      // Upload photos to storage and create alert_media records
      for (const photo of formData.photos) {
        try {
          // Convert base64 to blob
          const response = await fetch(photo);
          const blob = await response.blob();
          
          const fileName = `${newAlert.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
          
          const { error: uploadError } = await supabase.storage
            .from('alert-photos')
            .upload(fileName, blob, {
              contentType: 'image/jpeg',
            });
          
          if (uploadError) {
            console.error('Photo upload error:', uploadError);
            continue;
          }
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('alert-photos')
            .getPublicUrl(fileName);
          
          // Create alert_media record
          await supabase
            .from('alert_media')
            .insert({
              alert_id: newAlert.id,
              photo_url: urlData.publicUrl,
            });
        } catch (photoError) {
          console.error('Photo processing error:', photoError);
        }
      }
      
      setCreatedAlertId(newAlert.id);
      toast.success('Alerta publicado no mapa!');
      
      // Save user to localStorage for form prefill on next visit
      localStorage.setItem('sentinela_current_user', JSON.stringify({
        id: userId,
        fullName: formData.fullName,
        phone: phoneE164,
        token: token,
        defaultAddressText: fullAddress,
        defaultLat: formData.lat,
        defaultLng: formData.lng,
      }));
      
      // Move to success state
      setCurrentStep('enviar');
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Erro ao criar alerta. Tente novamente.');
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
                  onChange={(e) => {
                    updateFormData({ street: e.target.value });
                    setAddressSearched(false);
                  }}
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
                    onChange={(e) => {
                      updateFormData({ number: e.target.value });
                      setAddressSearched(false);
                    }}
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
                    onChange={(e) => {
                      updateFormData({ neighborhood: e.target.value });
                      setAddressSearched(false);
                    }}
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

              {addressSearched && (
                <p className="text-sm text-success flex items-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4" />
                  {formData.useCurrentLocation ? 'Localização obtida via GPS' : 'Endereço localizado com sucesso'}
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
