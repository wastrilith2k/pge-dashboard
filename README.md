# PNW Grid Monitor

A real-time dashboard displaying power grid data for the Pacific Northwest (Bonneville Power Administration region). Built with React, TypeScript, and Recharts.

![Dashboard Preview](preview.png)

## Features

- **Carbon Intensity Gauge** - Real-time MOER (Marginal Operating Emissions Rate) from WattTime
- **Generation Mix** - Stacked area chart showing hydro, wind, solar, gas, and other sources
- **System Demand** - Current load vs forecast with peak/low indicators
- **Interchange Panel** - Net imports/exports with neighboring regions

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd pge-dashboard

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_DEMO_MODE` | Set to `true` to use simulated data | No |
| `VITE_WATTTIME_USERNAME` | WattTime API username | For live data |
| `VITE_WATTTIME_PASSWORD` | WattTime API password | For live data |
| `VITE_EIA_API_KEY` | EIA (Energy Information Administration) API key | For live data |

**Demo Mode**: Set `VITE_DEMO_MODE=true` to run with simulated data (no API keys needed).

### API Keys

- **WattTime**: Register at [watttime.org](https://www.watttime.org/api-documentation/)
- **EIA**: Get a free key at [eia.gov](https://www.eia.gov/opendata/register.php)

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Recharts** - Charting library
- **CSS Modules** - Scoped component styles

## Project Structure

```
src/
├── components/       # React components with co-located CSS modules
├── data/
│   ├── api.ts        # Real API integration (WattTime, EIA)
│   ├── simulation.ts # Demo data generator
│   └── useGridData.ts# Data fetching hook
├── App.tsx           # Main layout
└── index.css         # Global styles and CSS variables
```

## License

MIT
