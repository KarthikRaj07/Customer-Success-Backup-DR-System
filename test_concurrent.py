import asyncio
import httpx

async def fetch():
    async with httpx.AsyncClient() as client:
        res1, res2 = await asyncio.gather(
            client.get("http://127.0.0.1:8001/customers"),
            client.get("http://127.0.0.1:8001/api/actions")
        )
        print("Customers:", res1.status_code)
        print("Actions:", res2.status_code)
        if res1.status_code != 200:
            print(res1.text)
        if res2.status_code != 200:
            print(res2.text)

asyncio.run(fetch())
