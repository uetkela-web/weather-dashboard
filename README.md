# Weatherly — Weather Dashboard

A responsive weather dashboard built with HTML, CSS and vanilla JavaScript. It fetches live weather data from the free [Open-Meteo API](https://open-meteo.com/) and does not require an API key.

## Features

- Search for a city; press Enter or click Search.
- Current temperature, feels-like temperature, weather condition, wind, humidity and precipitation.
- Five-day forecast with weather icons.
- Celsius / Fahrenheit switch.
- Dark / light mode saved in `localStorage`.
- Recent searches saved as quick-click chips.
- Optional current-location weather using the browser Geolocation API.
- Loading state, empty-input validation, city-not-found handling, HTTP status checks and network error messages.
- Responsive CSS Grid layout for desktop, tablet and mobile.

## Run locally

1. Download or clone this repository.
2. Open the folder in VS Code.
3. Start `index.html` with the **Live Server** extension, or run any static local server.
4. Search for a city such as `Pune`, `London` or `Tokyo`.

> Geolocation generally requires HTTPS or `localhost`. The dashboard's city search works without location permission.

## APIs used

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=en&format=json`
- Forecast: `https://api.open-meteo.com/v1/forecast`

The app uses `fetch()`, `async/await`, `response.json()`, `response.ok`, `try/catch`, DOM manipulation and `localStorage`.

## Deploy to GitHub and Vercel

1. Create a new GitHub repository named `weather-dashboard`.
2. Add `index.html`, `style.css`, `script.js` and `README.md`.
3. Commit and push:
   ```bash
   git init
   git add .
   git commit -m "Build responsive Weatherly dashboard"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/weather-dashboard.git
   git push -u origin main
   ```
4. Visit [Vercel](https://vercel.com/), sign in with GitHub and choose **Add New → Project**.
5. Import your repository and click **Deploy**. No build command is needed for this static site.

## Suggested test cases

- Search a valid city: `Pune`.
- Search a city with spaces: `New York`.
- Submit an empty input.
- Search a nonsense name: `xyznotacity123`.
- Switch between °C and °F.
- Toggle dark mode, refresh, and confirm the theme is remembered.
- Turn off internet briefly and verify the friendly network error.
- Test on a narrow mobile viewport.
# weather-dashboard
