import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PushMessage = {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data: {
    type: string;
    target_type: string;
    target_id: string;
  };
  priority: 'high';
  channelId: 'default';
};

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace('Bearer ', '');
  if (!jwt) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('cbn_app_profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  const payload = await req.json();
  const type = String(payload?.type ?? '').trim();
  const title = String(payload?.title ?? '').trim();
  const body = String(payload?.body ?? '').trim();
  const targetType = String(payload?.target_type ?? '').trim();
  const targetId = String(payload?.target_id ?? '').trim();

  if (!type || !title || !targetType || !targetId) {
    return new Response('Missing fields', { status: 400, headers: corsHeaders });
  }

  const notificationBody = body || 'Open the app for details.';

  const { data: tokens, error: tokensError } = await supabaseAdmin
    .from('cbn_app_push_tokens')
    .select('token, user_id, cbn_app_profiles!inner(role)')
    .eq('cbn_app_profiles.role', 'user');

  if (tokensError) {
    return new Response('Failed to load tokens', { status: 500, headers: corsHeaders });
  }

  const messages: PushMessage[] = (tokens ?? []).map((item: any) => ({
    to: String(item?.token ?? ''),
    sound: 'default',
    title,
    body: notificationBody,
    data: {
      type,
      target_type: targetType,
      target_id: targetId,
    },
    priority: 'high',
    channelId: 'default',
  }));

  if (messages.length === 0) {
    return new Response(JSON.stringify({ sent: 0, failed: 0, total: 0, errors: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let sent = 0;
  let failed = 0;
  const errors: Array<{ token: string; error: string }> = [];

  const chunks = chunk(messages, 100);
  for (const batch of chunks) {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      const details = await res.text();
      console.error('Failed to send push batch', details);
      failed += batch.length;
      for (const message of batch) {
        errors.push({
          token: String(message.to ?? 'unknown'),
          error: `HTTP ${res.status}: ${details}`,
        });
      }
      continue;
    }

    const responseBody = (await res.json().catch(() => null)) as
      | {
          data?: Array<{
            status?: 'ok' | 'error';
            message?: string;
            details?: {
              error?: string;
            };
          }>;
        }
      | null;

    const tickets = Array.isArray(responseBody?.data) ? responseBody.data : [];
    if (tickets.length === 0) {
      failed += batch.length;
      for (const message of batch) {
        errors.push({
          token: String(message.to ?? 'unknown'),
          error: 'Expo response did not include delivery tickets.',
        });
      }
      continue;
    }

    for (let i = 0; i < batch.length; i += 1) {
      const message = batch[i];
      const ticket = tickets[i];

      if (ticket?.status === 'ok') {
        sent += 1;
        continue;
      }

      failed += 1;
      const reason = ticket?.details?.error || ticket?.message || 'Unknown Expo push ticket error.';
      errors.push({
        token: String(message?.to ?? 'unknown'),
        error: reason,
      });
      console.error('Expo push ticket failed', {
        token: String(message?.to ?? 'unknown'),
        reason,
      });
    }
  }

  return new Response(JSON.stringify({ sent, failed, total: messages.length, errors: errors.slice(0, 20) }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
