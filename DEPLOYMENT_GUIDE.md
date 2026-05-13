# Ubuntu Deployment Guide

This guide walks you through deploying the IT Ticketing System on an Ubuntu server using Docker.

## Prerequisites

- An Ubuntu Server (20.04 LTS or 22.04 LTS recommended).
- SSH access to your server.
- Basic knowledge of using the Linux command line.

## Step 1: Install Docker and Docker Compose

Log into your server via SSH and update your package lists:

```bash
sudo apt update
sudo apt upgrade -y
```

Install Docker by downloading the official convenience script:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

Add your user to the `docker` group so you can run Docker commands without `sudo`:

```bash
sudo usermod -aG docker $USER
```
*(You may need to log out and log back in for this to take effect, or run `newgrp docker`)*

Install Docker Compose (plugin):

```bash
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

Verify installation:
```bash
docker --version
docker compose version
```

## Step 2: Clone Your Repository

Install Git if it's not already installed:

```bash
sudo apt install git -y
```

Clone your project to the server:

```bash
# Replace with your actual repository URL
git clone https://github.com/your-username/ticketing-system.git
cd ticketing-system
```

## Step 3: Configure Environment Variables

Create a `.env` file in the root directory (where `docker-compose.yml` is located) to securely define your application secrets. You can copy it from your local machine or create it fresh:

```bash
nano .env
```

Paste the following variables and update the values as needed for your production environment:

```ini
# PostgreSQL Database Settings
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_db_password
POSTGRES_DB=ticketing_system

# Backend Settings
# FRONTEND_URL is the domain or IP where your users will access the site
FRONTEND_URL=http://your-server-ip-or-domain
JWT_SECRET=generate_a_very_long_random_string_here
JWT_EXPIRES_IN=7d

# Email Configuration (for sending notifications/OTPs)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="IT Ticketing System <noreply@ticketing.com>"

# Frontend Settings
# VITE_API_URL must point to your server's IP/Domain where the backend is exposed (Port 3002)
VITE_API_URL=http://your-server-ip-or-domain:3002
```
Save the file (`Ctrl+O`, `Enter`, `Ctrl+X`).

**Note:** Ensure that `VITE_API_URL` points to the correct public IP or domain of your server on port 3002, as this is used by the client's browser to connect to the backend.

## Step 4: Build and Start the Application

With your `.env` file configured, start the application using Docker Compose:

```bash
docker compose up -d --build
```

- `-d`: Runs the containers in detached mode (in the background).
- `--build`: Forces Docker to build the images before starting.

*(The first build will take a few minutes as it downloads the base images and installs all dependencies.)*

## Step 5: Verify the Deployment

Check the status of your containers:

```bash
docker compose ps
```

You should see `ticketing_db`, `ticketing_backend`, and `ticketing_frontend` all in the `Up` state.

To view the logs for the backend (useful for checking if migrations ran successfully):

```bash
docker compose logs -f backend
```

## Step 6: Accessing Your Application

- **Frontend Application**: Open your web browser and navigate to `http://your-server-ip`.
- **Backend API**: The API is accessible at `http://your-server-ip:3002`.

## Step 7: (Optional) Set up Nginx as a Reverse Proxy with SSL (HTTPS)

While the frontend container runs Nginx on port 80, in a real production environment, you should use a reverse proxy (like Nginx on the host machine or a tool like Traefik/Caddy) to manage SSL certificates with Let's Encrypt. 

If you just need basic HTTP access, the current setup is complete!
