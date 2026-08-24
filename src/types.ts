export interface ClaudiaShareable {
  id: string;
  entity_type: string;
  entity_id: string;
  access_key: string;
  title: string | null;
  description: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}
export interface ClaudiaShareableResolution {
  id: string;
  project_slug: string;
  entity_type: string;
  entity_id: string;
  title: string | null;
  description: string | null;
}
