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

  const body = await req.json();
  const { email, password, name, initials, role, color, userRole, allowedModules, responsibilities } = body;

  if (!email || !password || !name) {
    return json({ error: 'email, password ve name zorunlu.' }, 400);
  }

  // Create auth user — email_confirm: true skips verification email
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) return json({ error: authError.message }, 400);

  const autoInitials = (initials as string) ||
    (name as string).split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const { data: userRow, error: insertError } = await adminClient
    .from('users')
    .insert({
      id: authData.user.id,
      name,
      initials: autoInitials,
      role: role || '',
      color: color || 'bg-blue-100 text-blue-700',
      user_role: userRole || 'calisan',
      allowed_modules: allowedModules ?? [],
      responsibilities: userRole === 'yonetici' ? ['purchasing'] : (responsibilities ?? []),
      email,
    })
    .select()
    .single();

  if (insertError) {
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return json({ error: insertError.message }, 400);
  }

  return json({ user: userRow });
});
