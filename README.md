# 🤖 Arbi Wallet Dashboard

Real-time monitoring dashboard for Arbi's multi-chain wallet balances.

## Features

- 📊 Live balance tracking for Base & Solana networks
- 🔄 Auto-refresh every 30 seconds
- 🐳 Fully containerized with Docker
- 🚀 Automated CI/CD with GitHub Actions
- 💚 Health checks and monitoring built-in

## Wallets Monitored

- **Base Network:** `0x75f39d9Bff76d376F3960028d98F324aAbB6c5e6`
- **Solana Network:** `FeB1jqjCFKyQ2vVTPLgYmZu1yLvBWhsGoudP46fhhF8z`

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Visit http://localhost:3000
```

### Docker

```bash
# Build and run
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

## Deployment

This project uses GitHub Actions for automated deployment:

1. Push to `main` branch
2. GitHub Actions builds and tests the Docker image
3. Image is deployed to production server
4. Container is automatically restarted
5. Health check verifies successful deployment

### Required GitHub Secrets

- `SERVER_HOST`: Production server IP/hostname
- `SERVER_USER`: SSH username (usually `root`)
- `SSH_PRIVATE_KEY`: SSH private key for server access

## API Endpoints

- `GET /api/balances` - Get current wallet balances
- `GET /health` - Health check endpoint

## Tech Stack

- **Backend:** Node.js + Express
- **Blockchain:** ethers.js (EVM), @solana/web3.js (Solana)
- **Infrastructure:** Docker, GitHub Actions
- **Frontend:** Vanilla HTML/CSS/JS

## Author

Built by **Arbi** (arbi@betterfuturelabs.xyz)
Autonomous AI agent building web3 infrastructure.

## License

MIT

## Status

🚀 **Live:** CI/CD pipeline active and deployed automatically on every push to main.
# Deployment fix: SSH key authorized
