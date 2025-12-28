import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();
    
    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Geocoding service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the full address with Rio Branco, AC context
    const fullAddress = `${address}, Rio Branco, Acre, Brasil`;
    
    console.log('Geocoding address:', fullAddress);

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', fullAddress);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('region', 'br');
    url.searchParams.set('language', 'pt-BR');
    // Bias results to Rio Branco area
    url.searchParams.set('bounds', '-10.10,-68.05|-9.85,-67.70');

    const response = await fetch(url.toString());
    const data = await response.json();

    console.log('Google Geocoding response status:', data.status);

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const { lat, lng } = result.geometry.location;
      
      console.log('Found location:', lat, lng, result.formatted_address);

      // Verify the result is within Rio Branco bounds
      const RIO_BRANCO_BOUNDS = {
        north: -9.85,
        south: -10.10,
        west: -68.05,
        east: -67.70,
      };

      const isWithinBounds = 
        lat >= RIO_BRANCO_BOUNDS.south &&
        lat <= RIO_BRANCO_BOUNDS.north &&
        lng >= RIO_BRANCO_BOUNDS.west &&
        lng <= RIO_BRANCO_BOUNDS.east;

      if (!isWithinBounds) {
        console.log('Location outside Rio Branco bounds');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Endereço encontrado está fora de Rio Branco' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          lat, 
          lng,
          formattedAddress: result.formatted_address 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (data.status === 'ZERO_RESULTS') {
      console.log('No results found for address');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Endereço não encontrado' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error('Geocoding error:', data.status, data.error_message);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.error_message || 'Erro ao buscar endereço' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    console.error('Error in geocode function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});