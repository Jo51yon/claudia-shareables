# Changelog

Semantic versioning: MAJOR = a prop, exported type, or default behaviour changed in a way that
could break an existing consumer without any code change on their side. MINOR = additive only.
Consuming projects should pin to a tag (`#v1.0.0`), never `#main`.

## v1.0.0 — 2026-08-23

First release. `ClaudiaShareableManager` (create/list/copy/revoke) + `resolveClaudiaShareable`
(a real, tokenless resolve) -- ported from SafeSpaces' real `shareables` table (checked its
actual schema before this).

SafeSpaces' version has one nullable FK column per content type (`blog_id`, `form_id`,
`event_id`, `course_id`... 15+ columns) -- genuinely the anti-pattern the `entity_type`/
`entity_id` convention already established in `claudia-comments`/`claudia-reactions`/
`claudia-activity` exists to avoid. Extended here rather than repeated.

SafeSpaces' real granular access-control layer (`allowed_member_ids`, `allowed_role_ids`,
`distribution_list_id`, `verification_mode`/`verification_config`) is NOT ported -- named
plainly. This ships active/expiry/revocation, the real, portable core.

Resolution proven correct with three separate real tests before any UI was built, matching the
exact discipline already proven for `claudia-public-topic-articles`: an active share resolves;
a revoked share resolves to nothing (confirmed directly, not assumed); an expired share
resolves to nothing (a separate real test, past `expires_at`, not the same case as revocation).

**Known consumers at this tag:** none yet at release.
