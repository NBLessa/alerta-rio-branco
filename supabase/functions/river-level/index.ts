import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fonte oficial: SGB/CPRM - SACE Bacia do Rio Acre
// Estação RBR - 13600002 - RIO BRANCO (pm=2)
const COTA_CSV_URL = 'https://www.sgb.gov.br/sace/sace_nivel/api/dados/acre_2_cota.csv';
const CHUVA_CSV_URL = 'https://www.sgb.gov.br/sace/sace_nivel/api/dados/acre_2_chuva.csv';

function parseLastRow(csv: string): { datetime: string; value: number } | null {
  const lines = csv.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
  // Search from the end for last line with a valid numeric value
  for (let i = lines.length - 1; i >= 0; i--) {
    const parts = lines[i].split(';');
    if (parts.length < 2) continue;
    const dt = parts[0].trim();
    const val = parseFloat(parts[1].replace(',', '.'));
    if (!isNaN(val) && /\d{4}-\d{2}-\d{2}/.test(dt)) {
      return { datetime: dt, value: val };
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching SGB river level CSVs...');

    const [cotaRes, chuvaRes] = await Promise.all([
      fetch(COTA_CSV_URL, { headers: { 'Accept': 'text/csv' } }),
      fetch(CHUVA_CSV_URL, { headers: { 'Accept': 'text/csv' } }),
    ]);

    if (!cotaRes.ok) {
      console.error('SGB cota fetch failed:', cotaRes.status);
      return new Response(
        JSON.stringify({ success: false, error: `Erro SGB cota: ${cotaRes.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cotaCsv = await cotaRes.text();
    const chuvaCsv = chuvaRes.ok ? await chuvaRes.text() : '';

    const lastCota = parseLastRow(cotaCsv);
    const lastChuva = chuvaCsv ? parseLastRow(chuvaCsv) : null;

    if (!lastCota) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sem dados disponíveis no SGB' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // datetime format: "YYYY-MM-DD HH:MM:SS"
    const [datePart, timePart] = lastCota.datetime.split(' ');

    const data = {
      id: '13600002',
      rio: 'Rio Acre - Rio Branco',
      data: datePart,
      hora: timePart || '',
      chuvaEmMm: lastChuva?.value ?? 0,
      cotaEmCm: lastCota.value,
    };

    console.log('SGB river level:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error fetching SGB river level:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
