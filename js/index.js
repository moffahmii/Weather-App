// ==== Query Selectors ====
const cityInput = document.querySelector('.city-input');
const searchBtn = document.querySelector('.search-btn');
const notFound = document.querySelector('.not-found');
const searchCity = document.querySelector('.search-city');
const weatherInfo = document.querySelector('.weather-info');

const forecastModal = document.querySelector('.forecast-modal');
const modalDate = document.querySelector('.modal-date');
const modalIcon = document.querySelector('.modal-icon');
const modalTemp = document.querySelector('.modal-temp');
const modalHumidity = document.querySelector('.modal-humidity');
const modalWind = document.querySelector('.modal-wind');
const modalCondition = document.querySelector('.modal-condition');
const closeBtn = document.querySelector('.close-btn');

const apiKey = "8dccc24c54f6f0cade19bca3e0962360";

// ==== Event Listeners ====
searchBtn.addEventListener('click', () => {
    if (cityInput.value.trim() !== '') {
        updateWeatherData(cityInput.value.trim());
        cityInput.value = '';
        cityInput.blur();
    }
});

cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && cityInput.value.trim() !== '') {
        updateWeatherData(cityInput.value.trim());
        cityInput.value = '';
        cityInput.blur();
    }
});

// ==== Fetch Function ====
async function getFetchData(endPoint, city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
        const errorData = await response.json();
        return Promise.reject(errorData.message || "City not found");
    }

    return response.json();
}

// ==== Update Weather Data ====
async function updateWeatherData(city) {
    try {
        const [currentData, forecastData] = await Promise.all([
            getFetchData('weather', city),
            getFetchData('forecast', city)
        ]);

        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        showDisplaySection(weatherInfo);

    } catch (error) {
        console.error("City not found or API error:", error);
        showDisplaySection(notFound);
    }
}

// ==== Show Section Function ====
function showDisplaySection(section) {
    const sections = [notFound, searchCity, weatherInfo];
    sections.forEach(s => s.style.display = 'none');
    section.style.display = 'flex';
}

function displayCurrentWeather(data) {
    document.querySelector('.country-text').textContent = `${data.name}, ${data.sys.country}`;
    document.querySelector('.temp').textContent = `${Math.round(data.main.temp)} °C`;
    document.querySelector('.condition').textContent = data.weather[0].description;

    const infoBox = document.querySelector('.weather-summary-info');

    let minMaxEl = infoBox.querySelector('.minmax');
    if (!minMaxEl) {
        minMaxEl = document.createElement('p');
        minMaxEl.classList.add('minmax');
        infoBox.appendChild(minMaxEl);
    }

    const tempMin = Math.round(data.main.temp_min);
    const tempMax = Math.round(data.main.temp_max);
    minMaxEl.textContent = `H: ${tempMax}° / L: ${tempMin}°`;

    document.querySelector('.weather-conditions .condition-item:nth-child(1) h5:last-child').textContent = `${data.main.humidity}%`;
    document.querySelector('.weather-conditions .condition-item:nth-child(2) h5:last-child').textContent = `${data.wind.speed} M/S`;

    const icon = data.weather[0].icon;
    document.querySelector('.weather-summary-img').src = `./imgs/weather/${getIconName(icon)}.svg`;

    updateCityTime(data.timezone);
}


// ==== Display Forecast with Clickable Modal ====
function displayForecast(data) {
    const forecastContainer = document.querySelector('.forecast-container');
    forecastContainer.innerHTML = '';

    const dailyData = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });

        if (!dailyData[dayKey]) {
            dailyData[dayKey] = { temps: [], icon: item.weather[0].icon, humidity: [], wind: [], condition: [] };
        }

        dailyData[dayKey].temps.push(item.main.temp);
        dailyData[dayKey].humidity.push(item.main.humidity);
        dailyData[dayKey].wind.push(item.wind.speed);
        dailyData[dayKey].condition.push(item.weather[0].description);
    });

    const days = Object.keys(dailyData).slice(0, 5);

    days.forEach(day => {
        const temps = dailyData[day].temps;
        const maxTemp = Math.round(Math.max(...temps));
        const minTemp = Math.round(Math.min(...temps));
        const icon = getIconName(dailyData[day].icon);
        const humidity = Math.round(dailyData[day].humidity.reduce((a, b) => a + b, 0) / dailyData[day].humidity.length);
        const wind = Math.round(dailyData[day].wind.reduce((a, b) => a + b, 0) / dailyData[day].wind.length);
        const condition = dailyData[day].condition[0];

        const forecastItem = document.createElement('div');
        forecastItem.classList.add('forecast-items');
        forecastItem.innerHTML = `
            <h5 class="forecast-date">${day}</h5>
            <img src="./imgs/weather/${icon}.svg" alt="">
            <h5 class="forecast-temp">
                <span style="color:#ffb703;">${maxTemp}°</span> / 
                <span style="color:#bde0fe;">${minTemp}°</span>
            </h5>
        `;

        forecastItem.addEventListener('click', () => {
            modalDate.textContent = day;
            modalIcon.src = `./imgs/weather/${icon}.svg`;
            modalTemp.textContent = `Temp: ${maxTemp}°C / ${minTemp}°C`;
            modalHumidity.textContent = `Humidity: ${humidity}%`;
            modalWind.textContent = `Wind: ${wind} M/S`;
            modalCondition.textContent = `Condition: ${condition}`;
            forecastModal.style.display = 'flex';
        });

        forecastContainer.appendChild(forecastItem);
    });
}

// ==== Close Modal ====
closeBtn.addEventListener('click', () => {
    forecastModal.style.display = 'none';
});
forecastModal.addEventListener('click', (e) => {
    if (e.target === forecastModal) forecastModal.style.display = 'none';
});

// ==== Helper: Icon Mapping ====
function getIconName(iconCode) {
    const iconMap = {
        "01d": "clear", "01n": "clear", "02d": "clouds", "02n": "clouds",
        "03d": "clouds", "03n": "clouds", "04d": "clouds", "04n": "clouds",
        "09d": "drizzle", "09n": "drizzle", "10d": "rain", "10n": "rain",
        "11d": "thunderstorm", "11n": "thunderstorm", "13d": "snow", "13n": "snow",
        "50d": "atmosphere", "50n": "atmosphere"
    };
    return iconMap[iconCode] || "clouds";
}

// ==== Update Date & Time ====
function updateCityTime(timezoneOffset) {
    function formatTime() {
        const nowUTC = new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000);
        const cityTime = new Date(nowUTC.getTime() + timezoneOffset * 1000);
        const options = { weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true };
        document.querySelector('.current-date').textContent = cityTime.toLocaleString('en-US', options);
    }
    clearInterval(window.cityTimeInterval);
    formatTime();
    window.cityTimeInterval = setInterval(formatTime, 60000);
}

// ==== Initial State ====
showDisplaySection(searchCity);
