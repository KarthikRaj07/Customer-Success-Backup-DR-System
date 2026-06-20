# Customer-Success-Backup-DR-System
<!-- source venv/bin/activate -->

<!-- git push -u origin main -->

## Running Locally

**Terminal 1 — Backend:**
```bash
cd /home/karthiii/Documents/CustomerSuccessSystem/backend
source venv/bin/activate
uvicorn main:app --reload --port 8001
```

**Terminal 2 — Frontend:**
```bash
cd /home/karthiii/Documents/CustomerSuccessSystem/frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Then open **http://127.0.0.1:5173** in your browser.