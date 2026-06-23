import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tgbwmcgnyqejjyrxurab.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnYndtY2dueXFlamp5cnh1cmFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjIxMDU5NCwiZXhwIjoyMDk3Nzg2NTk0fQ.i4qHN60-IDrsL9_0bSFhJ1GHJPhEPPNhxmoTI1ckum8";

export const supabase = createClient(supabaseUrl, supabaseKey);
