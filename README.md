# Sustainable Eco-Friendly Digital Nomads Directory

A curated directory of sustainable, eco-friendly venues and services for digital nomads in Thailand, built with Next.js.

## ⚡ 2-Minute Quick Start

Get the project running in 2 minutes:

```bash
# 1. Clone and install dependencies
git clone https://github.com/Eiat5522/sustainable-eco-friendly-digital-nomads-directory.git
cd sustainable-eco-friendly-digital-nomads-directory
npm install

# 2. Setup environment
cp .env.example app-next-directory/.env.local
# Edit app-next-directory/.env.local with your MongoDB and Sanity credentials

# 3. Start development server
npm run dev
# → Open http://localhost:3000
```

**Need help with setup?** See the [Complete Onboarding Guide](./docs/ONBOARDING.md)

### Windows PowerShell
```powershell
# Alternative: Use clean install script
.\clean-install.ps1
```

### Environment Setup
- **MongoDB**: Free tier at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Sanity CMS**: Free account at [sanity.io](https://sanity.io)
- **Configuration**: See [Environment Guide](./docs/ENVIRONMENT.md)

## 🏗️ Project Architecture


- 🌱 Curated eco-friendly listings
- 📍 Interactive map integration
- 🖼️ Optimized image loading
- 📱 Responsive design
- 🌓 Dark mode support
- 🗺️ SEO-friendly

## Tech Stack

- Next.js 15.3.2
- TypeScript
- Tailwind CSS
- Leaflet.js for maps
- Next/Image for optimized images

## Getting Started

1. Clone the repository:
```bash
git clone [repository-url]
cd sustainable-eco-friendly-digital-nomads-directory
```

2. Install dependencies:
```bash
cd app-scaffold
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
app-scaffold/
├── public/
│   └── images/
│       └── listings/    # Listing images
├── src/
│   ├── app/            # Next.js app router pages
│   ├── components/     # React components
│   ├── lib/           # Utility functions
│   └── types/         # TypeScript types
└── ...configuration files
```

## Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
