Thanks for pointing that out! It looks like the code block for the folder structure didn’t render visually clear enough in markdown. Here’s an improved version of your **README.md** with proper fenced code blocks and better formatting for copy-paste or display in GitHub, VS Code, or Sanity Studio:

---

# 🪴 Sustainable Digital Nomads Directory – Sanity Studio

This folder contains the **Sanity Studio** CMS for the Sustainable Digital Nomads Directory project.

---

## 📁 Folder Structure

```plaintext
/sanity
  /sustainable-nomads        # Sanity Studio root
    /schemas                 # All custom schema definitions (city, listing, etc.)
    /deskStructure.js        # (If used) Custom desk structure
    sanity.config.js         # Main Sanity configuration
    ...
```

---

## 🚀 Quick Start

1. **Install dependencies:**

   ```bash
   cd sustainable-nomads
   npm install
   ```

2. **Start Sanity Studio locally:**

   ```bash
   npm run dev
   # or
   sanity start
   ```

3. **Open [http://localhost:3333](http://localhost:3333) in your browser.**

---

## 📝 Working with Schemas

* Add or edit schema files in `/schemas` (e.g., `city.js`, `listing.js`).
* Register new schemas in `/schemas/index.js`.
* After any schema change, **restart the Studio** to apply updates.

---

## 🔗 Connecting with Next.js Frontend

* The Next.js app lives in `../app-scaffold`.
* Use your Sanity project ID, dataset, and API version for client connections.
* See `/app-scaffold/lib/sanity.js` for the client setup.

---

## ⚙️ Environment & CORS

* Make sure your CORS settings in [Sanity manage project](https://www.sanity.io/manage) allow your frontend’s domain (`http://localhost:3000` for local dev).

---

## 🤝 Team Practices

* Use version control (git) for all schema/config changes.
* Store secrets/tokens in `.env` files—**never commit secrets!**
* See [`sanity-checklist.md`](./sanity-checklist.md) for best practices and workflow reminders.

---

## 📚 Further Reading

* [Sanity Documentation](https://www.sanity.io/docs)
* [GROQ Query Reference](https://www.sanity.io/docs/query-cheat-sheet)
* [Portable Text](https://portabletext.org/)

---

*If you have questions or need help, ping your team or check Sanity’s Discord/Slack!*

---

**This version should render cleanly and be readable anywhere! If you need a version for your Next.js app, just say the word.**
