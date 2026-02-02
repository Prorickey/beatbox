# Deployment Setup

## GitHub Repository Secrets

Go to **Settings > Secrets and variables > Actions** in the GitHub repo and add:

| Secret                   | Description                                                 |
| ------------------------ | ----------------------------------------------------------- |
| `SERVER_HOST`            | IP address or hostname of the deployment server             |
| `SERVER_USER`            | SSH username on the server                                  |
| `SSH_PRIVATE_KEY`        | Private SSH key for authentication (the full PEM block)     |
| `REGISTRY_PASSWORD`      | Password for `tbedson-deploy` on `docker.bedson.tech`       |
| `NEXT_PUBLIC_SOCKET_URL` | Public URL for the bot's Socket.io server (e.g. `https://beatbox.bedson.tech`) |

## Server Setup

### 1. Create a deploy user

The deploy user only needs Docker access and ownership of the deployment directory — no root or sudo required.

```bash
# On the server, as root:
useradd -m -s /bin/bash deploy
usermod -aG docker deploy
mkdir -p /opt/deployments/beatbox
chown deploy:deploy /opt/deployments/beatbox
```

Generate an SSH key pair for the deploy user:

```bash
sudo -u deploy ssh-keygen -t ed25519 -C "github-actions-deploy" -f /home/deploy/.ssh/id_ed25519 -N ""
sudo -u deploy bash -c 'cat /home/deploy/.ssh/id_ed25519.pub >> /home/deploy/.ssh/authorized_keys'
chmod 600 /home/deploy/.ssh/authorized_keys
```

Print the private key and copy it for the GitHub secret:

```bash
cat /home/deploy/.ssh/id_ed25519
```

Paste the full output (including the `-----BEGIN/END-----` lines) as the `SSH_PRIVATE_KEY` secret in GitHub, and set `SERVER_USER` to `deploy`.

### 2. Authenticate Docker with the registry

On the server, log in to `docker.bedson.tech` so `docker compose pull` can fetch images:

```bash
sudo -u deploy docker login docker.bedson.tech -u tbedson-deploy
```

Docker stores the credential in `~/.docker/config.json` so this only needs to be done once.

### 3. Copy the compose file and Lavalink config

```bash
# Copy the production compose file from the repo (renamed to docker-compose.yml on server)
cp docker-compose.prod.yml /opt/deployments/beatbox/docker-compose.yml

# Copy the Lavalink config
mkdir -p /opt/deployments/beatbox/lavalink
cp lavalink/application.yml /opt/deployments/beatbox/lavalink/
```

### 4. Create the environment file

The compose file reads secrets via `${VAR}` interpolation. Create `/opt/deployments/beatbox/.env` with the actual values:

```env
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
LAVALINK_PASSWORD=youshallnotpass
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=beatbox
NEXTAUTH_SECRET=
```

### 6. Verify

After the first push to `main`, confirm the containers are running:

```bash
cd /opt/deployments/beatbox
docker compose ps
```

View logs for a specific service:

```bash
docker compose logs -f bot
docker compose logs -f dashboard
```
