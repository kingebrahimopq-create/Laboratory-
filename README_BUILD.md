# My Lab LIMS - Build Instructions

## Quick Start

### Prerequisites
- Node.js 20.0.0 or higher
- npm 10.0.0 or higher

### Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Format code
npm run format
```

## Building for Production

### Web Application
```bash
npm run build
npm start
```

### Windows Desktop Application

#### Option 1: Automated Script (Recommended)
```bash
# On Windows
build_windows.bat

# On Linux/Mac
chmod +x build_windows.sh
./build_windows.sh
```

#### Option 2: Manual Build
```bash
npm run build
npm run electron:build
```

The Windows executable will be created in `dist-electron/` directory:
- `MyLab-LIMS-Setup-x.x.x.exe` - Installer
- `MyLab-LIMS-Portable-x.x.x.exe` - Portable version

### Android Application
```bash
npm run android:build
```

### Electron Development
```bash
npm run electron:dev
```

## Build Outputs

| Target | Command | Output | Description |
|--------|---------|--------|-------------|
| Web | `npm run build` | `dist/` | Production web build |
| Windows | `npm run electron:build` | `dist-electron/` | Windows installer & portable |
| Android | `npm run android:build` | `android/app/build/` | Android APK |

## Deployment

### Vercel Deployment
The project includes `vercel.json` configuration for automatic deployment:

```bash
# Deploy to Vercel
vercel deploy
```

### Docker Deployment
```bash
docker build -t mylab-lims .
docker run -p 3000:3000 mylab-lims
```

## Troubleshooting

### Build Fails
```bash
npm run clean
npm cache clean --force
npm install
npm run build
```

### Port Already in Use
```bash
# Change port in server.ts or use environment variable
PORT=3001 npm run dev
```

### Database Issues
```bash
npm run db:seed
npm run db:migrate
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development

# AI
GEMINI_API_KEY=your_api_key_here

# Firebase (optional)
FIREBASE_API_KEY=your_key
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Google Drive (optional)
GOOGLE_DRIVE_API_KEY=your_api_key

# Lab Configuration
DEFAULT_LAB_NAME_AR=معمل النيل للتحاليل الطبية
```

## Documentation

- [Windows Build Guide](./BUILD_WINDOWS_GUIDE.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)

## Support

For issues and questions:
- GitHub Issues: [Laboratory Issues](https://github.com/kingebrahimopq-create/Laboratory-/issues)
- Documentation: Check the docs folder
- Email: support@mylab.com

---

**Version**: 2.0.0  
**Last Updated**: 2026-06-16
