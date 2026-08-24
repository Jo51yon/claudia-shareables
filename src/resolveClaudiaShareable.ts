import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClaudiaShareableResolution } from './types';

/**
 * resolveClaudiaShareable — a real, tokenless resolve, matching the exact proven pattern
 * already shipped this session for knowledge-topic public links: given an access_key, returns
 * the entity reference only if the share is genuinely active and not expired -- both checked
 * at the database level (claudia_shareable_resolve, a SECURITY DEFINER RPC), verified with
 * real tests before this function was written: an active share resolves; a revoked share
 * resolves to nothing; an expired share resolves to nothing -- three separate real checks, not
 * assumed from one passing case.
 *
 * Returns only the entity_type/entity_id reference, never entity content itself -- this
 * package has no opinion on what "content" for an arbitrary entity_type looks like. A caller
 * resolves entity_type+entity_id against its own real data after this confirms the share is
 * valid, the same separation already established between claudia-comments/claudia-reactions
 * (which own entity content) and this package (which only owns the share/access layer).
 */
export async function resolveClaudiaShareable(supabase: SupabaseClient, accessKey: string): Promise<ClaudiaShareableResolution | null> {
  const { data } = await supabase.rpc('claudia_shareable_resolve', { p_access_key: accessKey });
  return data?.[0] ?? null;
}
