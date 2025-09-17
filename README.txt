
Spanish Video Explorer - Static Site (Google Sheets Live Link)

You had only 3 rows because the sample data.csv was still in your repo.
Use your full Google Sheet in two ways:

Option A. Replace data.csv
1. In Google Sheets: File > Download > Comma-separated values (.csv)
2. Name it data.csv and upload it to the repo root, replacing the old file.

Option B. Read directly from Google Sheets (no more manual exports)
1. Share the Sheet for viewing: Share > Anyone with the link > Viewer.
2. Get a CSV link:
   - Publish to the web: File > Share > Publish to web > select the tab > CSV. Copy the link.
     OR
   - Build the link:
     https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv&gid=GID
     • SHEET_ID is in the sheet URL
     • GID is the tab id (see URL ...gid=123456789)
3. Open config.js and paste your CSV link:
   window.DATA_CSV_URL = "https://docs.google.com/spreadsheets/d/XXXX/export?format=csv&gid=0";
4. Commit index.html, styles.css, script.js, config.js. Keep data.csv as a fallback.

Hard refresh your site after updating.

Header names accepted
Title/Título, URL/Enlace, Country/País, Region/Región, Speaker/Presentador, Level/Nivel, Topic/Tema, Language/Idioma, Description/Descripción, Thumbnail/Imagen.
