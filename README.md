# Enterprise Application O.2 Deployment Starter

This repository provides a complete, production-style deployment setup on AWS EC2 using Docker and Docker Compose.
It includes:
- **React Frontend (served via Nginx)**
- **Node.js Backend API**
- **Python FastAPI Microservice**
- **PostgreSQL Database**
- **Redis Cache**
- **Nginx Reverse Proxy with SSL (two options)**
  - **Option A:** Host-Based Nginx + Certbot
  - **Option B:** Containerized Nginx + Certbot

The guide is written step by step so you can deploy from scratch without missing anything.

---

## Table of Contents
- [1. Prerequisites](#1-prerequisites)
- [2. Repository Structure](#2-repository-structure)
- [3. Quick Start (No Domain)](#3-quick-start-no-domain)
- [4. Option A — Host Nginx + Certbot](#4-option-a--host-nginx--certbot)
- [5. Option B — Containerized Nginx + Certbot](#5-option-b--containerized-nginx--certbot)
- [6. License](#6-license)

---

## 1. Prerequisites
- Ubuntu 22.04 EC2 instance
- Domain Name with A records pointing to EC2 public IP
- Security Group open on Ports `22`, `80`, `443`
- Installed on EC2:
  - `docker` and `docker-compose`
  - `git`

---

## 2. Repository Structure
```bash
enterprise-app-O.2/
├─ .env
├─ docker-compose.yml
├─ backend-node/
│ ├─ src/index.js
│ ├─ package.json
│ └─ Dockerfile
├─ backend-python/
│ ├─ app/main.py
│ ├─ requirements.txt
│ └─ Dockerfile
├─ frontend/
│ ├─ src/
│ ├─ package.json
│ ├─ package-lock.json
│ ├─ Dockerfile
│ └─ nginx/default.conf
├─ nginx/
│ └─ conf.d/default.conf
└─ traefik/ (optional for advanced TLS)
```

---

## 3. Quick Start (No Domain)
- Clone Repo:
```bash
git clone https://github.com/your-org/enterprise-app-O.2.git
cd enterprise-app-O.2
```

- Build and Start Stack:
```bash
docker compose build
docker compose up -d
```

- Access via EC2 Public IP:
**Frontend** → http://<EC2_IP>:3000
**Backend** → http://<EC2_IP>:3001
**Python API** → http://<EC2_IP>:8000

---

## 4. Option A — Host Nginx + Certbot
- Start Stack with exposed ports:
```bash
docker compose up -d
```

- Install Nginx + Certbot on Host:
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

- Create Nginx Config /etc/nginx/sites-available/enterprise-app-O.2:
```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
    }

    location /micro/ {
        proxy_pass http://127.0.0.1:8000;
    }
}
```

- Enable Nginx Config:
```bash
sudo ln -s /etc/nginx/sites-available/enterprise-app-O.2 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

- Request SSL Cert:
```bash
sudo certbot --nginx -d example.com -d www.example.com
```

---

## 5. Option B — Containerized Nginx + Certbot
- Create the Directories:
```bash
mkdir -p nginx/conf.d 
mkdir -p nginx/certbot/www 
mkdir -p nginx/certbot/conf
```

- Add Nginx Config nginx/conf.d/default.conf:
```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://frontend:80;
    }

    location /api/ {
        proxy_pass http://backend-node:3001;
    }
}
```

- Start Services:
```bash
docker compose up -d --build
```

- Request Cert:
```bash
docker compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d example.com -d www.example.com \
  --email admin@example.com --agree-tos --non-interactive
```

- Update nginx/conf.d/default.conf for HTTPS:
```nginx
server {
    listen 80;
    server_name example.com www.example.com;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name example.com www.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        proxy_pass http://frontend:80;
    }

    location /api/ {
        proxy_pass http://backend-node:3001;
    }
}
```

- Restart Nginx:
```bash
docker compose restart nginx
```

- Renewal (cronjob on Host):
```cron
0 3 * * * cd /path/to/project && docker compose run --rm certbot renew && docker compose restart nginx
```

---
