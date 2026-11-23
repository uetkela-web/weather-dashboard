const API = "https://api.open-meteo.com/v1";
const GEO_API = "https://geocoding-api.open-meteo.com/v1/search";

const form = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const message = document.querySelector("#message");
const weatherSection = document.querySelector("#weather-section");
const forecastGrid = document.querySelector("#forecast-grid");
const recentContainer = document.querySelector("#recent-searches");
const themeToggle = document.querySelector("#theme-toggle");
const locationButton = document.querySelector("#location-button");

let currentWeather = null;
let currentUnit = "c";

const weatherDescriptions = {
  0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"], 45: ["Fog", "🌫️"], 48: ["Depositing rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Heavy drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"], 57: ["Heavy freezing drizzle", "🌧️"],
  61: ["Light rain", "🌦️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"], 67: ["Heavy freezing rain", "🌧️"],
  71: ["Light snow", "🌨️"], 73: ["Snow", "❄️"], 75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "❄️"], 80: ["Rain showers", "🌦️"], 81: ["Rain showers", "🌧️"],
  82: ["Heavy rain showers", "⛈️"], 85: ["Snow showers", "🌨️"], 86: ["Heavy snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm with hail", "⛈️"], 99: ["Thunderstorm with hail", "⛈️"]
};

const getWeatherInfo = code => weatherDescriptions[code] || ["Unknown conditions", "🌡️"];
const toFahrenheit = celsius => (celsius * 9 / 5) + 32;
const displayTemp = value => Math.round(currentUnit === "c" ? value : toFahrenheit(value));
const unitLabel = () => currentUnit === "c" ? "°C" : "°F";

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function setLoading(isLoading) {
  const button = form.querySelector(".search-button");
  button.disabled = isLoading;
  button.textContent = isLoading ? "Loading…" : "Search →";
}

async function fetchWeather(city) {
  // First convert the city name into geographic coordinates.
  const geoResponse = await fetch(`${GEO_API}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
  if (!geoResponse.ok) throw new Error(`Location search failed (HTTP ${geoResponse.status}).`);
  const geoData = await geoResponse.json();
  const place = geoData.results?.[0];
  if (!place) throw new Error(`We couldn't find "${city}". Check the spelling and try again.`);

  // Then request current conditions and five daily forecasts.
  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: "5"
  });
  const weatherResponse = await fetch(`${API}/forecast?${params}`);
  if (!weatherResponse.ok) throw new Error(`Weather service error (HTTP ${weatherResponse.status}).`);
  const weatherData = await weatherResponse.json();
  return { place, weatherData };
}

function renderWeather({ place, weatherData }) {
  currentWeather = { place, weatherData };
  const { current, daily } = weatherData;

  document.querySelector("#location-name").textContent =
    [place.name, place.admin1, place.country].filter(Boolean).join(", ");
  document.querySelector("#local-time").textContent = `Local time: ${current.time.replace("T", " ")}`;
  document.querySelector("#current-temp").textContent = displayTemp(current.temperature_2m);
  document.querySelector("#temp-unit").textContent = unitLabel();
  document.querySelector("#current-condition").textContent = getWeatherInfo(current.weather_code)[0];
  document.querySelector("#current-icon").textContent = getWeatherInfo(current.weather_code)[1];
  document.querySelector("#feels-like").textContent = `Feels like ${displayTemp(current.apparent_temperature)}${unitLabel()}`;
  document.querySelector("#today-high").textContent = `${displayTemp(daily.temperature_2m_max[0])}${unitLabel()}`;
  document.querySelector("#today-low").textContent = `${displayTemp(daily.temperature_2m_min[0])}${unitLabel()}`;
  document.querySelector("#wind-speed").textContent = Math.round(current.wind_speed_10m);
  document.querySelector("#humidity").textContent = current.relative_humidity_2m;
  document.querySelector("#precipitation").textContent = Number(current.precipitation).toFixed(1);

  forecastGrid.replaceChildren();
  daily.time.forEach((date, index) => {
    const [condition, icon] = getWeatherInfo(daily.weather_code[index]);
    const dayName = index === 0 ? "Today" : new Date(`${date}T12:00:00`).toLocaleDateString("en", { weekday: "short" });
    const card = document.createElement("article");
    card.className = "forecast-card";
    card.innerHTML = `
      <div class="forecast-day">${dayName}</div>
      <div class="forecast-icon" aria-hidden="true">${icon}</div>
      <div class="forecast-condition">${condition}</div>
      <div class="forecast-temps">${displayTemp(daily.temperature_2m_max[index])}${unitLabel()}
        <span>${displayTemp(daily.temperature_2m_min[index])}${unitLabel()}</span>
      </div>`;
    forecastGrid.append(card);
  });

  weatherSection.hidden = false;
  showMessage("");
  renderRecentSearches(place.name);
}

function showError(error) {
  weatherSection.hidden = true;
  const friendlyMessage = error instanceof TypeError
    ? "Network error. Please check your internet connection and try again."
    : error.message || "Something went wrong. Please try again.";
  showMessage(friendlyMessage, true);
}

async function searchCity(city) {
  const trimmedCity = city.trim();
  if (!trimmedCity) {
    showMessage("Please enter a city name before searching.", true);
    cityInput.focus();
    return;
  }

  setLoading(true);
  showMessage("Finding the latest weather…");
  try {
    const result = await fetchWeather(trimmedCity);
    renderWeather(result);
    saveRecentSearch(result.place.name);
  } catch (error) {
    showError(error);
  } finally {
    setLoading(false);
  }
}

function saveRecentSearch(city) {
  const searches = JSON.parse(localStorage.getItem("weatherRecent") || "[]");
  const updated = [city, ...searches.filter(item => item.toLowerCase() !== city.toLowerCase())].slice(0, 5);
  localStorage.setItem("weatherRecent", JSON.stringify(updated));
  renderRecentSearches();
}

function renderRecentSearches(highlightedCity = "") {
  const searches = JSON.parse(localStorage.getItem("weatherRecent") || "[]");
  recentContainer.replaceChildren();
  if (!searches.length) return;
  const label = document.createElement("span");
  label.className = "muted";
  label.textContent = "Recent:";
  label.style.cssText = "font-size:12px;align-self:center;margin-right:3px";
  recentContainer.append(label);
  searches.forEach(city => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "recent-chip";
    chip.textContent = city;
    chip.setAttribute("aria-label", `Search weather for ${city}`);
    chip.addEventListener("click", () => {
      cityInput.value = city;
      searchCity(city);
    });
    recentContainer.append(chip);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === "dark";
  themeToggle.innerHTML = isDark ? "☀ <span>Light mode</span>" : "☾ <span>Dark mode</span>";
  localStorage.setItem("weatherTheme", theme);
}

form.addEventListener("submit", event => {
  event.preventDefault();
  searchCity(cityInput.value);
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
});

document.querySelectorAll(".unit-button").forEach(button => {
  button.addEventListener("click", () => {
    currentUnit = button.dataset.unit;
    document.querySelectorAll(".unit-button").forEach(item => item.classList.toggle("active", item === button));
    if (currentWeather) renderWeather(currentWeather);
  });
});

locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showMessage("Geolocation is not supported by this browser.", true);
    return;
  }
  showMessage("Getting your location…");
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        latitude: coords.latitude, longitude: coords.longitude,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
        daily: "weather_code,temperature_2m_max,temperature_2m_min",
        timezone: "auto", forecast_days: "5"
      });
      const response = await fetch(`${API}/forecast?${params}`);
      if (!response.ok) throw new Error(`Weather service error (HTTP ${response.status}).`);
      const weatherData = await response.json();
      const place = { name: "Your location", country: "", latitude: coords.latitude, longitude: coords.longitude };
      renderWeather({ place, weatherData });
      saveRecentSearch(place.name);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, () => showMessage("Location access was denied or unavailable. You can search for a city instead.", true));
});

applyTheme(localStorage.getItem("weatherTheme") || "light");
renderRecentSearches();
