import os
import httpx
import traceback
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from dotenv import load_dotenv

import schemas

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in the .env file")

# Setup REST headers for Supabase API client
HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"  # Returns the created/updated resource
}

app = FastAPI(
    title="Customer Success & Re-Engagement Automation System API",
    description="Backend API proxying requests to Supabase REST API (Port 443) to bypass socket firewall blocks.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "*" # Fallback if credentials aren't strict
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to enrich customer data with computed properties
def enrich_customer(c: dict) -> dict:
    backup_status = c.get("backup_status")
    usage = c.get("usage")
    tickets = c.get("tickets")
    
    # Compute Health Status
    if backup_status == "Failed":
        health = "Critical"
    elif (usage is not None and usage < 40) or (tickets is not None and tickets > 3):
        health = "At Risk"
    else:
        health = "Healthy"
        
    # Compute Suggested Action
    if backup_status == "Failed":
        action = "Fix Backup Immediately"
    elif usage is not None and usage < 40:
        action = "Schedule Training"
    elif tickets is not None and tickets > 3:
        action = "Escalate Issue"
    else:
        action = "No action required"
        
    c["health_status"] = health
    c["suggested_action"] = action
    return c

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Customer Success Backup & DR System API!",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

# ==========================================
# SEED DATABASE
# ==========================================
@app.post("/seed", status_code=200)
async def seed_database():
    """Deletes existing customers & CTAs and seeds database with realistic sample records."""
    async with httpx.AsyncClient() as client:
        # Delete existing data (Using filters to clean tables)
        await client.delete(f"{SUPABASE_URL}/rest/v1/ctas?id=gt.0", headers=HEADERS)
        await client.delete(f"{SUPABASE_URL}/rest/v1/customers?id=gt.0", headers=HEADERS)
        
        # Sample Customers
        sample_customers = [
            {
                "name": "Acme Corporation",
                "usage": 85,
                "last_login": "2026-06-18",
                "tickets": 1,
                "backup_status": "Success",
                "last_backup": "2026-06-19"
            },
            {
                "name": "Cyberdyne Systems",
                "usage": 25,
                "last_login": "2026-06-10",
                "tickets": 2,
                "backup_status": "Success",
                "last_backup": "2026-06-19"
            },
            {
                "name": "Initech LLC",
                "usage": 70,
                "last_login": "2026-06-05",
                "tickets": 5,
                "backup_status": "Success",
                "last_backup": "2026-06-18"
            },
            {
                "name": "Umbrella Corp",
                "usage": 15,
                "last_login": "2026-06-15",
                "tickets": 4,
                "backup_status": "Failed",
                "last_backup": "2026-06-12"
            },
            {
                "name": "Stark Industries",
                "usage": 98,
                "last_login": "2026-06-20",
                "tickets": 0,
                "backup_status": "Success",
                "last_backup": "2026-06-20"
            },
            {
                "name": "Hooli Inc",
                "usage": 38,
                "last_login": "2026-06-14",
                "tickets": 6,
                "backup_status": "Failed",
                "last_backup": "2026-06-11"
            },
            {
                "name": "Wayne Enterprises",
                "usage": 90,
                "last_login": "2026-06-19",
                "tickets": 0,
                "backup_status": "Success",
                "last_backup": "2026-06-19"
            }
        ]
        
        res = await client.post(f"{SUPABASE_URL}/rest/v1/customers", headers=HEADERS, json=sample_customers)
        if res.status_code not in (200, 201):
            raise HTTPException(status_code=500, detail=f"Failed to seed customers: {res.text}")
            
    return {"message": "Database seeded with 7 sample customers successfully"}

# ==========================================
# CUSTOMER ENDPOINTS
# ==========================================
@app.get("/customers", response_model=List[schemas.Customer])
async def get_customers():
    try:
        async with httpx.AsyncClient() as client:
            # Fetch customers and CTAs separately, then merge in Python
            cust_res = await client.get(f"{SUPABASE_URL}/rest/v1/customers?select=*", headers=HEADERS)
            if cust_res.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Failed to fetch customers: {cust_res.text}")

            ctas_res = await client.get(f"{SUPABASE_URL}/rest/v1/ctas?select=*", headers=HEADERS)
            all_ctas = ctas_res.json() if ctas_res.status_code == 200 else []

            customers = cust_res.json()
            for c in customers:
                c["ctas"] = [cta for cta in all_ctas if cta["customer_id"] == c["id"]]
            return [enrich_customer(c) for c in customers]
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Internal Error: {str(e)}")

@app.get("/customers/{customer_id}", response_model=schemas.Customer)
async def get_customer(customer_id: int):
    try:
        async with httpx.AsyncClient() as client:
            cust_res = await client.get(f"{SUPABASE_URL}/rest/v1/customers?select=*&id=eq.{customer_id}", headers=HEADERS)
            if cust_res.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Failed to fetch customer: {cust_res.text}")

            data = cust_res.json()
            if not data:
                raise HTTPException(status_code=404, detail="Customer not found")

            ctas_res = await client.get(f"{SUPABASE_URL}/rest/v1/ctas?select=*&customer_id=eq.{customer_id}", headers=HEADERS)
            data[0]["ctas"] = ctas_res.json() if ctas_res.status_code == 200 else []
            return enrich_customer(data[0])
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Internal Error: {str(e)}")

@app.post("/customers", response_model=schemas.Customer, status_code=201)
async def create_customer(customer: schemas.CustomerCreate):
    try:
        async with httpx.AsyncClient() as client:
            payload = customer.model_dump()
            if payload.get("last_login"):
                payload["last_login"] = payload["last_login"].isoformat()
            if payload.get("last_backup"):
                payload["last_backup"] = payload["last_backup"].isoformat()

            res = await client.post(f"{SUPABASE_URL}/rest/v1/customers", headers=HEADERS, json=payload)
            if res.status_code not in (200, 201):
                raise HTTPException(status_code=400, detail=f"Failed to create customer: {res.text}")

            data = res.json()
            data[0]["ctas"] = []
            return enrich_customer(data[0])
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Internal Error: {str(e)}")

@app.put("/customers/{customer_id}", response_model=schemas.Customer)
async def update_customer(customer_id: int, customer: schemas.CustomerUpdate):
    try:
        async with httpx.AsyncClient() as client:
            payload = customer.model_dump(exclude_unset=True)
            if payload.get("last_login"):
                payload["last_login"] = payload["last_login"].isoformat()
            if payload.get("last_backup"):
                payload["last_backup"] = payload["last_backup"].isoformat()

            res = await client.patch(f"{SUPABASE_URL}/rest/v1/customers?id=eq.{customer_id}", headers=HEADERS, json=payload)
            if res.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Failed to update customer: {res.text}")

            data = res.json()
            if not data:
                raise HTTPException(status_code=404, detail="Customer not found")

            ctas_res = await client.get(f"{SUPABASE_URL}/rest/v1/ctas?select=*&customer_id=eq.{customer_id}", headers=HEADERS)
            data[0]["ctas"] = ctas_res.json() if ctas_res.status_code == 200 else []
            return enrich_customer(data[0])
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Internal Error: {str(e)}")

@app.delete("/customers/{customer_id}")
async def delete_customer(customer_id: int):
    try:
        async with httpx.AsyncClient() as client:
            res = await client.delete(f"{SUPABASE_URL}/rest/v1/customers?id=eq.{customer_id}", headers=HEADERS)
            if res.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Failed to delete customer: {res.text}")
        return {"message": f"Customer {customer_id} successfully deleted"}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Internal Error: {str(e)}")


# ==========================================
# ACTION (CALL TO ACTIONS) ENDPOINTS
# ==========================================
@app.get("/api/actions", response_model=List[schemas.CTA])
async def get_ctas():
    try:
        async with httpx.AsyncClient() as client:
            ctas_res = await client.get(f"{SUPABASE_URL}/rest/v1/ctas?select=*", headers=HEADERS)
            if ctas_res.status_code != 200:
                print(f"Supabase GET CTAs Error: {ctas_res.text}")
                raise HTTPException(status_code=400, detail=f"Failed to fetch CTAs: {ctas_res.text}")

            # Fetch all customers to build a name lookup map
            cust_res = await client.get(f"{SUPABASE_URL}/rest/v1/customers?select=id,name", headers=HEADERS)
            customer_map = {}
            if cust_res.status_code == 200:
                for c in cust_res.json():
                    customer_map[c["id"]] = c["name"]

            ctas = ctas_res.json()
            for cta in ctas:
                cta["customer_name"] = customer_map.get(cta["customer_id"], "Unknown")
            return ctas
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Internal Error: {str(e)}")

@app.post("/api/generate-actions", status_code=200)
async def generate_ctas():
    try:
        async with httpx.AsyncClient() as client:
            # Fetch all customers
            cust_res = await client.get(f"{SUPABASE_URL}/rest/v1/customers?select=*", headers=HEADERS)
            if cust_res.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Failed to fetch customers: {cust_res.text}")
            customers = cust_res.json()
            
            # Fetch active/pending CTAs
            ctas_res = await client.get(f"{SUPABASE_URL}/rest/v1/ctas?status=in.(Pending,In Progress)", headers=HEADERS)
            active_ctas = ctas_res.json() if ctas_res.status_code == 200 else []
            
            # Map of customer_id -> active action titles to prevent duplication
            active_map = {}
            for cta in active_ctas:
                active_map.setdefault(cta["customer_id"], set()).add(cta["action"])
                
            generated_count = 0
            new_ctas = []
            
            for customer in customers:
                c_id = customer["id"]
                
                # Check 1: Backup failed
                if customer.get("backup_status") == "Failed":
                    action = "Fix Backup Immediately"
                    if c_id not in active_map or action not in active_map[c_id]:
                        new_ctas.append({
                            "customer_id": c_id,
                            "action": action,
                            "priority": "High",
                            "status": "Pending"
                        })
                        generated_count += 1
                        
                # Check 2: Low usage
                if customer.get("usage") is not None and customer.get("usage") < 40:
                    action = "Schedule Training"
                    if c_id not in active_map or action not in active_map[c_id]:
                        new_ctas.append({
                            "customer_id": c_id,
                            "action": action,
                            "priority": "Medium",
                            "status": "Pending"
                        })
                        generated_count += 1
                        
                # Check 3: High tickets
                if customer.get("tickets") is not None and customer.get("tickets") > 3:
                    action = "Escalate Issue"
                    if c_id not in active_map or action not in active_map[c_id]:
                        new_ctas.append({
                            "customer_id": c_id,
                            "action": action,
                            "priority": "High",
                            "status": "Pending"
                        })
                        generated_count += 1
                        
            if new_ctas:
                post_res = await client.post(f"{SUPABASE_URL}/rest/v1/ctas", headers=HEADERS, json=new_ctas)
                if post_res.status_code not in (200, 201):
                    print(f"Supabase POST CTAs Error: {post_res.text}")
                    raise HTTPException(status_code=400, detail=f"Failed to save generated CTAs: {post_res.text}")
                    
        return {"status": "done", "generated_count": generated_count}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Internal Error: {str(e)}")

@app.patch("/api/actions/{cta_id}", response_model=schemas.CTA)
async def update_cta_status(cta_id: int, status_update: schemas.CTAStatusUpdate):
    try:
        async with httpx.AsyncClient() as client:
            payload = {"status": status_update.status}
            res = await client.patch(f"{SUPABASE_URL}/rest/v1/ctas?id=eq.{cta_id}", headers=HEADERS, json=payload)
            if res.status_code != 200:
                print(f"Supabase PATCH CTA Error: {res.text}")
                raise HTTPException(status_code=400, detail=f"Failed to update CTA status: {res.text}")

            data = res.json()
            if not data:
                raise HTTPException(status_code=404, detail="CTA not found")

            cta = data[0]
            # Lookup customer name separately
            cust_res = await client.get(f"{SUPABASE_URL}/rest/v1/customers?select=id,name&id=eq.{cta['customer_id']}", headers=HEADERS)
            if cust_res.status_code == 200 and cust_res.json():
                cta["customer_name"] = cust_res.json()[0]["name"]
            else:
                cta["customer_name"] = "Unknown"
            return cta
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Internal Error: {str(e)}")

@app.delete("/api/actions/{cta_id}")
async def delete_cta(cta_id: int):
    try:
        async with httpx.AsyncClient() as client:
            res = await client.delete(f"{SUPABASE_URL}/rest/v1/ctas?id=eq.{cta_id}", headers=HEADERS)
            if res.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Failed to delete CTA: {res.text}")
        return {"message": f"CTA {cta_id} successfully deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Internal Error: {str(e)}")
