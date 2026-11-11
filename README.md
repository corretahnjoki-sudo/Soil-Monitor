# Soil Club Monitor

Reporting app for the Regeneration Station regenerative agriculture club.
Patron teachers send activity reports from their phones; the coordinator reviews
them, edits them, and generates an all-schools programme report.

## Deploy on Vercel
1. Import this repository at https://vercel.com/new (Framework preset: Other).
2. Before deploying, add two Environment Variables:
   - `ADMIN_CODE`: the coordinator's sign-in code
   - `PATRON_CODE`: a random code used inside the patron links
3. Deploy, then open the project's Storage tab, create a **Blob** store with
   **Private** access, and connect it to this project.
4. Redeploy so the app picks up the storage token.
