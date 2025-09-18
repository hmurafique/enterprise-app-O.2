from fastapi import FastAPI
import os

app = FastAPI()

@app.get('/internal/health')
async def health():
    return {'status': 'ok', 'service': 'fastapi-micro'}

@app.get('/internal/info')
async def info():
    return {'python_version': '3.11+', 'env': os.getenv('ENV', 'dev')}
