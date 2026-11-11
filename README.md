# Soil Club Monitor

Reporting app for the Regeneration Station regenerative agriculture club.
Patron teachers send activity reports from their phones; the coordinator reviews
them, edits them, and generates an all-schools programme report.

## Deploy on Vercel
1. Import this repository at https://vercel.com/new (Framework preset: Other).
2. Before deploying, add one Environment Variable:
   - `ADMIN_CODE`: the coordinator's secret code. Open the site once as
     `https://<your-site>.vercel.app/?join=<ADMIN_CODE>#dashboard` on each device
     you use; everyone else only sees the report form (no sign-in page).
3. Deploy, then open the project's Storage tab, create a **Blob** store with
   **Private** access, and connect it to this project.
4. Redeploy so the app picks up the storage token.
