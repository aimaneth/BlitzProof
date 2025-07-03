# 🛡️ BlitzProof - Web3 Smart Contract Security Platform

A comprehensive, decentralized smart contract security platform that provides automated vulnerability scanning, AI-powered analysis, and professional audit services for blockchain applications.

## 🌟 Features

### 🔍 **Smart Contract Scanner**
- **Real-time vulnerability detection** using Slither security tool
- **20+ EVM networks supported** (Ethereum, Polygon, BSC, Arbitrum, Optimism, and more)
- **AI-powered analysis** with machine learning models
- **Custom security rules** engine with pattern matching
- **Batch scanning** for multiple contracts
- **Professional reporting** with severity rankings

### 🎯 **Professional Audit Services**
- **Comprehensive security assessments** for smart contracts
- **Expert manual review** by security specialists
- **Detailed remediation guidance** with code examples
- **On-chain verification** and public certification badges
- **Custom pricing** based on contract complexity and asset value

### 🚀 **Advanced Features**
- **Wallet authentication** with MetaMask integration
- **Real-time updates** via WebSocket connections
- **Export functionality** (JSON, CSV, HTML formats)
- **User dashboard** with scan history and analytics
- **Profile management** with reputation system
- **Responsive design** for mobile and desktop

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 15** with TypeScript
- **Radix UI** components for accessibility
- **Tailwind CSS** for styling
- **RainbowKit** for wallet connection
- **Socket.io** for real-time updates
- **Framer Motion** for animations

### **Backend**
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** database (Supabase)
- **Redis** for caching and sessions
- **Slither** security tool integration
- **AI/ML** analysis services

### **Infrastructure**
- **Vercel** for frontend deployment
- **Render** for backend hosting
- **Supabase** for database and storage
- **Docker** for containerization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Git
- MetaMask wallet

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/aimaneth/BlitzProof.git
cd BlitzProof
```

2. **Install dependencies**
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. **Set up environment variables**

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

**Backend (.env)**
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=your-supabase-connection-string
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3002
REDIS_URL=redis://localhost:6379
```

4. **Start the development servers**
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

5. **Open your browser**
- Frontend: http://localhost:3002
- Backend API: http://localhost:4000

## 🚀 Deployment

### Free Deployment Stack
- **Frontend**: Vercel (Free)
- **Backend**: Render (Free)
- **Database**: Supabase (Free)
- **File Storage**: Supabase Storage (Free)

### Deployment Guide
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## 📊 Supported Networks

The platform supports 20+ EVM networks including:
- Ethereum
- Polygon
- BSC (Binance Smart Chain)
- Arbitrum
- Optimism
- Avalanche
- Fantom
- Base
- Linea
- zkSync
- Scroll
- Mantle
- Celo
- Gnosis
- Moonbeam
- Harmony
- Cronos
- Klaytn
- Metis
- Boba

## 🔧 Configuration

### Security Tools
- **Slither**: Automated vulnerability detection
- **Custom Rules**: User-defined security patterns
- **AI Analysis**: Machine learning-based risk assessment

### API Endpoints
- `GET /health` - Health check
- `POST /api/scan` - Start contract scan
- `GET /api/scan/:id` - Get scan results
- `POST /api/custom-rules` - Create custom rule
- `POST /api/batch-scan/start` - Start batch scan

## 📈 Performance

### Scan Performance
- **Single Contract**: 30-60 seconds
- **Batch Processing**: Up to 5 concurrent scans
- **AI Analysis**: 10-15 seconds per vulnerability
- **Custom Rules**: 5-10 seconds per rule set

### Scalability
- **Concurrent Users**: 100+ simultaneous users
- **File Size Limit**: 10MB per contract
- **Batch Size**: Up to 20 contracts per batch

## 🛡️ Security Features

- **Input Validation** - All user inputs validated
- **SQL Injection Protection** - Parameterized queries
- **XSS Protection** - Content Security Policy
- **CSRF Protection** - Token-based authentication
- **Rate Limiting** - API rate limiting implemented
- **File Upload Security** - File type and size validation
- **Authentication** - JWT-based authentication
- **Authorization** - Role-based access control

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [docs](./docs) folder
- **Issues**: [GitHub Issues](https://github.com/aimaneth/BlitzProof/issues)
- **Discussions**: [GitHub Discussions](https://github.com/aimaneth/BlitzProof/discussions)

## 🏆 Acknowledgments

- **Slither** - Smart contract security tool
- **Supabase** - Database and authentication
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **OpenZeppelin** - Security best practices

---

**Built with ❤️ for the Web3 security community** 