# Unified User Management Solution - To-Do List

## 1. MongoDB as Single Source of Truth

- [ ] **1.1** Extend MongoDB user model to include all necessary fields:
  - [ ] Name, email, hashed password
  - [ ] Role field (user, editor, venueOwner, admin, superAdmin)
  - [ ] Status flags (active, suspended, pending)
  - [ ] Timestamps (createdAt, updatedAt)
- [ ] **1.2** Ensure email remains unique in MongoDB (add unique constraint)
- [ ] **1.3** Define unique identifier strategy for Mongo-Sanity linking (email or MongoDB `_id`)
- [ ] **1.4** Update existing code to treat MongoDB as authoritative source for user records

---

## 2. Admin Panel - Centralized User Creation & Management

### Create User Functionality

- [ ] **2.1** Add "Add New User" UI workflow/form in admin panel
  - [ ] Input fields: name, email, password, role selection
- [ ] **2.2** Create API route `/api/admin/create-user` to handle user creation
- [ ] **2.3** Implement MongoDB user creation in the API route
  - [ ] Hash password
  - [ ] Assign selected or default role
- [ ] **2.4** Implement automatic Sanity user creation after MongoDB insert
  - [ ] Reuse existing `createSanityUser` utility
  - [ ] Store minimal fields (name, email, avatar)

### Role Assignment & Changes

- [ ] **2.5** Add "Promote/Change Role" action in admin UI
- [ ] **2.6** Create API endpoint for role updates
- [ ] **2.7** Update MongoDB user role field on role change
- [ ] **2.8** Sync role changes to Sanity document
- [ ] **2.9** Handle session refresh for logged-in users after role change

### Activate/Deactivate (Suspension)

- [ ] **2.10** Implement activate/suspend toggle in admin UI
- [ ] **2.11** Add status field update in MongoDB (active/suspended)
- [ ] **2.12** Update `authenticateUser` function to check user status and block suspended users

---

## 3. Synchronize Sanity for Content References

### One-Way Sync (MongoDB → Sanity)

- [ ] **3.1** Implement auto-creation of Sanity user doc on any user creation path:
  - [ ] Admin-created users
  - [ ] Self-registered users
  - [ ] OAuth sign-ups
- [ ] **3.2** Implement auto-update of Sanity doc on profile changes (name, avatar, etc.)
- [ ] **3.3** Keep role field in Sanity and sync it for conditional UI logic

### Sanity Studio Configuration

- [ ] **3.4** Configure Sanity Studio permissions to prevent direct user document creation/editing by content authors
- [ ] **3.5** Keep `updateSanityUserWithAuthDetails` logic in NextAuth signIn callback

---

## 4. Handling Listings and Blog Post Authors

### Blog Post Authors

- [ ] **4.1** Maintain blog post author reference to Sanity user document
- [ ] **4.2** Ensure all users who can be authors exist in Sanity via sync
- [ ] **4.3** Implement role-based gating for blog writing features (editor role required)

### Listing Owners

- [ ] **4.4** Reintroduce/retain role field on Sanity user doc for OwnedListings conditional logic
- [ ] **4.5** Implement listing owner assignment in admin panel (optional)
  - [ ] Allow selecting owner on listing edit page
  - [ ] Patch Sanity user's `ownedListings` array
- [ ] **4.6** Enforce business rule: only venueOwner/admin can have owned listings
- [ ] **4.7** Handle existing listings when user role is demoted from venueOwner

---

## 5. Authentication Flow with Auth.js (NextAuth)

- [ ] **5.1** Extend NextAuth Mongo adapter to handle custom fields (role, status)
- [ ] **5.2** Ensure OAuth users get default role ('user') saved to MongoDB
  - [ ] Use `events.createUser` callback or custom adapter
- [ ] **5.3** Keep signIn callback logic that creates/updates Sanity user on login
- [ ] **5.4** Verify session includes `role` field from JWT for route protection
- [ ] **5.5** Implement role-based access control for protected routes:
  - [ ] Admin-only routes (user management)
  - [ ] Editor-only routes (blog writing)
  - [ ] VenueOwner-only routes (listing management)

---

## 6. Avoiding Conflicts and Maintaining Consistency

### Prevent Manual Sanity Edits

- [ ] **6.1** Configure Sanity Studio roles/permissions to hide or lock user document type

### Data Integrity

- [ ] **6.2** Enforce unique emails across both MongoDB and Sanity
- [ ] **6.3** Keep existing checks in registration/creation routes for duplicates

### Data Migration

- [ ] **6.4** Create migration script to reintroduce role field to existing Sanity user docs
  - [ ] For each Sanity user, find corresponding MongoDB user by email
  - [ ] Set Sanity role field to match MongoDB role

### Consistency Audits

- [ ] **6.5** Create audit script to verify every MongoDB user has corresponding Sanity doc
- [ ] **6.6** Create audit script to find orphaned Sanity user docs (no matching MongoDB user)
- [ ] **6.7** Schedule or manually run periodic consistency checks

---

## Summary

| Section | Total Tasks |
|---------|-------------|
| 1. MongoDB Single Source of Truth | 4 |
| 2. Admin Panel User Management | 12 |
| 3. Sanity Sync | 5 |
| 4. Listings & Blog Authors | 7 |
| 5. Authentication Flow | 5 |
| 6. Consistency & Migration | 7 |
| **Total** | **40** |

---

## References

- Source PRD: `.taskmaster/docs/prd.txt`
- Key files:
  - `app-next-directory/src/lib/auth/userService.ts`
  - `app-next-directory/src/app/admin/users/page.tsx`
  - `app-next-directory/src/app/api/auth/[...nextauth]/route.ts`
  - `app-next-directory/src/app/api/auth/register/route.ts`
  - `sanity-backup/SCHEMA_RELATIONSHIPS.md`
