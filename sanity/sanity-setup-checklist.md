# 🧩 Sanity Studio Setup & Collaboration Checklist

## ✅ Version Control
- [ ] Initialize a git repository (if not already done).
- [ ] Commit your starting state before major changes.
- [ ] Make separate commits for:
  - Sanity Studio scaffold
  - Schema setup
  - Integration with frontend

---

## ✅ Environment Variables
- [ ] Store all API keys and tokens in `.env` files.
- [ ] Add `.env*` to `.gitignore`.
- [ ] Share `.env.local` (non-secret values) with teammates as needed.

---

## ✅ Sanity Studio Setup
- [ ] Scaffold Sanity Studio into `/sanity/sustainable-nomads`.
- [ ] Place all schema files in the `/schemas` directory.
- [ ] Register all schemas in `/schemas/index.js` and only once in `sanity.config.js`.
- [ ] After editing schemas, restart the Studio.

---

## ✅ Integration & CORS
- [ ] Ensure the frontend domain (e.g., `http://localhost:3000`) is allowed in Sanity CORS settings.
- [ ] Test fetching data from the frontend (e.g., Next.js app).

---

## ✅ Schema & Data Management
- [ ] Keep all schema changes reviewed and merged through pull requests when possible.
- [ ] Test document creation and relationships (e.g., Listing references City) after schema edits.

---

## ✅ Documentation & Support
- [ ] Keep this checklist and main workflow notes in the project’s README.
- [ ] Document any custom queries or tricky config.
- [ ] Use [Sanity docs](https://www.sanity.io/docs) and community channels if needed.

---

## ✅ Team Tips
- [ ] Celebrate your first successful fetch or integration! 🎉
- [ ] Clean up unused files/folders to keep the repo tidy.
- [ ] If stuck, review recent commits for breaking changes.

---

_Stay organized, document your process, and support your teammates—smooth projects are happy projects!_
