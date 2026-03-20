# Frontend

The actual deployment instructions for this project live in the root guide:

- [Root README](/C:/Users/Anek/BuzinAvto/README.md)

## Quick Start

```powershell
cd C:\Users\Anek\BuzinAvto\b-nextjs-frontent-main
pnpm install
pnpm dev
```

Required environment variables:

```env
DATABASE_URI=mongodb://127.0.0.1:27017/buzinavto_front
PAYLOAD_SECRET=change_me
PAYLOAD_URL=http://localhost:3000
API_URL=http://127.0.0.1:8000/api/v1
```

Production:

```powershell
pnpm build
pnpm start
```
