# 🚀 Quick Start Guide

Get SafetyPro E-commerce Platform running in 5 minutes!

## One-Command Installation

```bash
git clone <repository-url> && cd siteJadid && bash scripts/deploy.sh
```

That's it! 🎉

## What Gets Installed?

- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ Elasticsearch search engine
- ✅ Next.js application
- ✅ Sample products and data

## Access Your Store

After installation:
- **Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Prisma Studio**: Run `npx prisma studio`

## Default Login

```
Email: admin@safetypro.com
Password: Admin123!
```

## Test Everything

```bash
bash scripts/test-deployment.sh
```

## Common Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Start production
npm run start

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Need Help?

- 📖 Full docs: [README.md](./README.md)
- 🔌 API docs: [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)
- 🚢 Deployment: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- 📝 Cheat sheet: [docs/CHEATSHEET.md](./docs/CHEATSHEET.md)

## Requirements

- Node.js 18+
- Docker & Docker Compose
- 4GB RAM minimum
- 20GB disk space

---

**Problems?** Check [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) troubleshooting section.
