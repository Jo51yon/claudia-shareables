import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClaudiaShareable } from './types';

/**
 * ClaudiaShareableManager — create, list, copy, and revoke share links for one entity. Real
 * generalisation of SafeSpaces' own shareables table (checked its actual schema before this):
 * that table has one nullable FK column per content type (blog_id, form_id, event_id,
 * course_id... 15+ columns), genuinely the anti-pattern the entity_type/entity_id convention
 * already established in claudia-comments/claudia-reactions/claudia-activity exists to avoid
 * -- extended here rather than repeated.
 *
 * SafeSpaces' real granular access-control layer (allowed_member_ids, allowed_role_ids,
 * distribution_list_id, verification_mode/verification_config) is NOT ported -- named plainly,
 * not silently dropped: this ships active/expiry/revocation, the real, portable core. A
 * project needing member- or role-scoped sharing builds that as its own real logic on top of
 * this table's real columns, or extends the schema directly -- speculative generalisation of
 * SafeSpaces' specific ACL shape would not be a proven pattern for Claudia's very different
 * real projects.
 */
export interface ClaudiaShareableManagerCopy {
  heading: string;
  createButton: string;
  titlePlaceholder: string;
  copyButton: string;
  copiedLabel: string;
  revokeButton: string;
  reactivateButton: string;
  revokedLabel: string;
  expiredLabel: string;
  empty: string;
  expiresLabel: string;
}
const DEFAULT_COPY: ClaudiaShareableManagerCopy = {
  heading: 'Share links',
  createButton: 'Create a share link',
  titlePlaceholder: 'What is this link for? (optional)',
  copyButton: 'Copy link',
  copiedLabel: 'Copied',
  revokeButton: 'Revoke',
  reactivateButton: 'Reactivate',
  revokedLabel: 'Revoked',
  expiredLabel: 'Expired',
  empty: 'No share links yet.',
  expiresLabel: 'Expires',
};

export interface ClaudiaShareableManagerProps {
  supabase: SupabaseClient;
  projectSlug: string;
  entityType: string;
  entityId: string;
  /** Builds the real, full public URL from an access_key -- routing is project-specific. */
  buildUrl: (accessKey: string) => string;
  copy?: Partial<ClaudiaShareableManagerCopy>;
}

export default function ClaudiaShareableManager({ supabase, projectSlug, entityType, entityId, buildUrl, copy: copyProp }: ClaudiaShareableManagerProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp };
  const [items, setItems] = useState<ClaudiaShareable[] | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function fetchAll() {
    supabase.from('claudia_shareables').select('*')
      .eq('project_slug', projectSlug).eq('entity_type', entityType).eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .then(({ data }: { data: ClaudiaShareable[] | null }) => setItems(data ?? []));
  }
  useEffect(fetchAll, [supabase, projectSlug, entityType, entityId]);

  async function create() {
    await supabase.from('claudia_shareables').insert({
      project_slug: projectSlug, entity_type: entityType, entity_id: entityId,
      title: newTitle.trim() || null,
    });
    setNewTitle('');
    fetchAll();
  }

  async function toggleActive(item: ClaudiaShareable) {
    await supabase.from('claudia_shareables').update({ is_active: !item.is_active }).eq('id', item.id);
    fetchAll();
  }

  function isExpired(item: ClaudiaShareable): boolean {
    return Boolean(item.expires_at && new Date(item.expires_at) < new Date());
  }

  function copyLink(item: ClaudiaShareable) {
    navigator.clipboard.writeText(buildUrl(item.access_key));
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (items === null) return null;

  return (
    <div>
      <h4 style={{ marginBottom: 8 }}>{copy.heading}</h4>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input className="field" placeholder={copy.titlePlaceholder} value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') create(); }} />
        <button type="button" className="btn sm" onClick={create}>{copy.createButton}</button>
      </div>

      {items.length === 0 ? (
        <p className="dim" style={{ fontSize: '.85rem' }}>{copy.empty}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item) => {
            const expired = isExpired(item);
            const revoked = !item.is_active;
            return (
              <div key={item.id} className="card" style={{ padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '.88rem', fontWeight: 600 }}>{item.title ?? 'Untitled link'}</p>
                  <p className="dim" style={{ margin: '2px 0 0', fontSize: '.75rem' }}>
                    {revoked && <span style={{ color: 'var(--claudia-kernel-alert, #b42318)' }}>{copy.revokedLabel} \u00b7 </span>}
                    {!revoked && expired && <span style={{ color: 'var(--claudia-kernel-alert, #b42318)' }}>{copy.expiredLabel} \u00b7 </span>}
                    {item.expires_at && <>{copy.expiresLabel} {new Date(item.expires_at).toLocaleDateString()}</>}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button type="button" className="btn quiet sm" onClick={() => copyLink(item)}>
                    {copiedId === item.id ? copy.copiedLabel : copy.copyButton}
                  </button>
                  <button type="button" className="btn quiet sm" onClick={() => toggleActive(item)}>
                    {item.is_active ? copy.revokeButton : copy.reactivateButton}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
