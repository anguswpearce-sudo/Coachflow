import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rhsdzspeuemsjnhlimkb.supabase.co'
const supabaseKey = 'sb_publishable_2eETCjDWDS9yJkoFSMC_xQ_07jzgnk0'
export const supabase = createClient(supabaseUrl, supabaseKey)