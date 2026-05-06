import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Verify caller is yönetici
  const callerClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user: caller } } = await callerClient.auth.getUser();
  if (!caller) return json({ error: 'Unauthorized' }, 401);

  const { data: callerRow } = await adminClient
    .from('users')
    .select('user_role')
    .eq('id', caller.id)
    .single();

  if (callerRow?.user_role !== 'yonetici') return json({ error: 'Forbidden' }, 403);

  const { userId } = await req.json();
  if (!userId) return json({ error: 'userId zorunlu.' }, 400);

  // Can't delete yourself
  if (userId === caller.id) return json({ error: 'Kendinizi silemezsiniz.' }, 400);

  // Delete from public.users first (FK constraint), then auth.users
  const { error: publicError } = await adminClient.from('users').delete().eq('id', userId);
  if (publicError) return json({ error: publicError.message }, 400);

  const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
  if (authError) return json({ error: authError.message }, 400);

  return json({ ok: true });
});
