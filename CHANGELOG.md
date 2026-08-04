# Creative Suite — Changelog & Update Log

All architectural updates, database migrations, and feature modifications are logged chronologically in this document for the development team.

---

## [Unreleased / 2.1.0] — 2026-08-03

### 🚀 Major Features & Architectural Additions

#### 1. Multi-Tenant Brand & Campaign Database Persistence
- **SQLAlchemy Models Added**:
  - `SuiteBrand` (`suite_brands` table): Stores complete Brand DNA records (brand name, website, industry, product description, audience, engagement type, timeline, scope of work, competitors, voice, archetype, USPs, words to use/avoid).
  - `SuiteProject` updated with `brand_id` and `brand_name` foreign reference linkage.
- **REST Endpoints Added**:
  - `GET /bff/brands` — Returns all onboarded brands for the authenticated user/agency.
  - `POST /bff/brands` — Persists newly onboarded Brand DNA to SQLite.
  - `DELETE /bff/brands/{brand_id}` — Removes a brand from the database.
  - `GET /bff/projects?brand_id={id}` — Returns campaigns, filtered optionally by Brand ID.
  - `POST /bff/projects` — Accepts `brand_id` and `brand_name` to link campaigns directly to a Brand.

#### 2. Brand-to-Campaign Linkage UI (`ProjectsScreen.jsx`)
- Added **Brand Selector Dropdown** in the top bar of the Projects/Campaigns view to filter campaigns by specific brand or view all.
- Required **Brand Selection Picker** in the "New Campaign" modal so every campaign belongs to a parent Brand.
- Direct link to open the **Brand Onboarding Modal** if no brands exist yet.

#### 3. Onboarded Brand Vault & Brand Brain Screen (`BrainScreen.jsx`)
- **Brand Cards Grid**: Transformed `BrainScreen` into an active **Onboarded Brand Vault** displaying all brand profiles created by the user (Brand Name, Industry, Website, Brand Voice, Archetype, USP, Target Audience, Vocabulary DOs/AVOID, Competitors, and Attached SOWs).
- **Direct Campaign Launcher**: Added a **"Create Campaign under Brand →"** button to each brand card for instant workflow creation.
- **Brand Deletion**: Added a delete action allowing users to remove outdated Brand DNA records from their database RAG memory.
- **Backend Sync**: Upon completing the 4-step Brand DNA onboarding modal, brand parameters are automatically POSTed to `/bff/brands` and synced in real-time.

#### 4. Campaign Team Member Invites & Email Dispatch (`ProjectsScreen.jsx` + `backend/main.py`)
- **SQLAlchemy Model Added**: `SuiteProjectInvite` (`suite_project_invites` table) to store pending & active team member invitations with roles (`Editor`, `Viewer`, `Admin`).
- **REST Endpoints & Mail Dispatch**:
  - `GET /bff/projects/{id}/members` — Lists active collaborators and pending email invites.
  - `POST /bff/projects/{id}/invites` — Invites team members by email, creates invitation record, and triggers formatted HTML email notification via background task.
  - **Email Enhancements**: Added parent **Brand Name** display (e.g. `Zomato`) and a direct **"Accept & Open Campaign →"** action button linking straight to the campaign workspace.
  - `DELETE /bff/projects/{id}/invites/{invite_id}` — Revokes invitation or removes member.
- **UI Button & Modal**: Added an **"Invite Team"** button on each campaign project card opening a team collaboration modal with role assignment and member list management.

#### 5. CopyAgent User ID Mapping & Self-Healing Proxy (`backend/main.py`)
- **Upstream ID Mapping**: Updated `_sync_to_copyagent` to store CopyAgent's assigned user ID in `SuiteUser.copyagent_user_id`. Updated `_upstream_headers` to automatically send the registered CopyAgent user ID in the `X-User-Id` header.
- **Self-Healing SSE Stream**: Fixed CopyAgent 404 handler in `_stream_from_upstream` so streaming completion requests automatically force-sync unmapped users and retry seamlessly.

#### 6. Invited Member Campaign Access (`backend/main.py`)
- **Shared Access Query**: Updated `GET /bff/projects` endpoint so that when an invited user (e.g. `tushar.yadav@cogculture.agency`) logs in, the query fetches both campaigns owned by the user **AND** campaigns to which their email has been invited via `SuiteProjectInvite`.

#### 6. Multi-Tenant Account Data Isolation (`ProjectsScreen.jsx`, `TopBar.jsx`, `backend/main.py`)
- **Strict Session Resolution**: Removed fallback to static admin user in `_get_current_user_id`. Backend endpoints now return data strictly for the authenticated user session.
- **Cross-Account Cache Cleanup**: Updated `handleLogout` in `TopBar.jsx` to clear `studio-projects`, `studio-brands`, `studio-brand-context`, and `studio-brand-brain-active` from local storage when logging out.
- **Server Single Source of Truth**: Updated `ProjectsScreen.jsx` so that active server responses (`/bff/brands` and `/bff/projects`) are strictly used, preventing brand-new accounts from displaying cached campaigns/brands from a previous user's browser session.

#### 7. Design System Token Refresh (`tokens.js`)
- Swapped light mode background token (`bg`: `#FFFFFF`) and component surface token (`surface`: `#F7F6F4`) for improved visual contrast and hierarchy.
- Removed hardcoded navigation badge counts (`3`, `7`, `42`) from sidebar navigation items in `data.js`.
