import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css"
import { useState, useEffect } from "react";
import './App.css';

function App() {
  const apiKey = "c9f7e703d48c6901579daa1536d9cb49"
  const [inputCity, setInputCity] = useState("")
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [unit, setUnit] = useState("metric") // metric for Celsius, imperial for Fahrenheit
  const [recentSearches, setRecentSearches] = useState([])

  // Load recent searches from memory on component mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('recentSearches') || '[]')
    setRecentSearches(saved)
  }, [])

  // Save recent searches to memory
  const saveRecentSearch = (cityName) => {
    const updated = [cityName, ...recentSearches.filter(city => city !== cityName)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const getWeatherDetails = (cityName) => {
    if (!cityName) return
    
    setLoading(true)
    setError("")
    
    const apiURL = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=${unit}`
    
    axios.get(apiURL).then((res) => {
      console.log("response", res.data)
      setData(res.data)
      saveRecentSearch(cityName)
      setLoading(false)
    }).catch((err) => {
      console.log("err", err)
      setError("City not found. Please check the spelling and try again.")
      setData({})
      setLoading(false)
    })
  }

  const handleChangeInput = (e) => {
    setInputCity(e.target.value)
    setError("") // Clear error when user starts typing
  }

  const handleSearch = () => {
    if (inputCity.trim()) {
      getWeatherDetails(inputCity.trim())
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleRecentSearchClick = (cityName) => {
    setInputCity(cityName)
    getWeatherDetails(cityName)
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true)
      setError("")
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const apiURL = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=${unit}`
          
          axios.get(apiURL).then((res) => {
            setData(res.data)
            setInputCity(res.data.name)
            saveRecentSearch(res.data.name)
            setLoading(false)
          }).catch((err) => {
            setError("Unable to fetch weather for your location.")
            setLoading(false)
          })
        },
        (error) => {
          setError("Location access denied. Please search manually.")
          setLoading(false)
        }
      )
    } else {
      setError("Geolocation is not supported by this browser.")
    }
  }

  const toggleUnit = () => {
    const newUnit = unit === "metric" ? "imperial" : "metric"
    setUnit(newUnit)
    
    // Refresh current weather data with new unit if data exists
    if (Object.keys(data).length > 0) {
      const apiURL = `https://api.openweathermap.org/data/2.5/weather?q=${data.name}&appid=${apiKey}&units=${newUnit}`
      
      axios.get(apiURL).then((res) => {
        setData(res.data)
      })
    }
  }

  const getWeatherIcon = (weatherMain, weatherId) => {
    // More detailed weather icons based on condition
    const iconMap = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '🌨️',
      'Mist': '🌫️',
      'Smoke': '🌫️',
      'Haze': '🌫️',
      'Dust': '🌫️',
      'Fog': '🌫️',
      'Sand': '🌫️',
      'Ash': '🌋',
      'Squall': '💨',
      'Tornado': '🌪️'
    }
    
    return iconMap[weatherMain] || '🌤️'
  }

  const clearSearch = () => {
    setInputCity("")
    setData({})
    setError("")
  }

  return (
    <div className="col-md-12">
      <div className="weatherBg">
        <h1 className="heading">🌤️ Weather App</h1>

        <div className="search-container">
          <div className="search-form-container">
            <div className="input-group mb-4">
              <input 
                type="text" 
                className="form-control search-input" 
                placeholder='Search city...'
                value={inputCity}
                onChange={handleChangeInput}
                onKeyPress={handleKeyPress}
              />
              {inputCity && (
                <button className="btn btn-outline-secondary clear-btn" onClick={clearSearch}>
                  ✕
                </button>
              )}
            </div>
            
            <div className="button-group">
              <button 
                className="btn btn-primary search-btn" 
                type="button"
                onClick={handleSearch}
                disabled={loading || !inputCity.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Searching...
                  </>
                ) : (
                  '🔍 Search'
                )}
              </button>
              
              <button 
                className="btn btn-success location-btn" 
                onClick={getCurrentLocation}
                disabled={loading}
              >
                📍 Current Location
              </button>
              
              <button 
                className="btn btn-info unit-toggle" 
                onClick={toggleUnit}
              >
                °{unit === "metric" ? "C" : "F"} | °{unit === "metric" ? "F" : "C"}
              </button>
            </div>
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="recent-searches mt-3">
              <small className="text-light">Recent searches:</small>
              <div className="recent-buttons mt-2">
                {recentSearches.map((city, index) => (
                  <button
                    key={index}
                    className="btn btn-outline-light btn-sm me-2 mb-2 recent-city-btn"
                    onClick={() => handleRecentSearchClick(city)}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger mt-4 error-message" role="alert">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Weather Result */}
      {Object.keys(data).length > 0 && (
        <div className="col-md-12 text-center mt-5 weather-result-container" >
          <div className="shadow rounded weatherResultBox">
            <div className="weather-icon-large">
              {getWeatherIcon(data?.weather?.[0]?.main, data?.weather?.[0]?.id)}
            </div>

            <h5 className="weatherCity">
              📍 {data?.name}, {data?.sys?.country}
            </h5>
            
            <div className="temperature-display">
              <h6 className="temperature">
                {Math.round(data?.main?.temp)}°{unit === "metric" ? "C" : "F"}
              </h6>
              <p className="feels-like">
                Feels like {Math.round(data?.main?.feels_like)}°{unit === "metric" ? "C" : "F"}
              </p>
            </div>

            <div className="weather-description">
              <h6 className="weather-main">{data?.weather?.[0]?.main}</h6>
              <p className="weather-desc">{data?.weather?.[0]?.description}</p>
            </div>

            <div className="weather-details">
              <div className="weather-detail-item">
                <span className="detail-label">💧 Humidity</span>
                <span className="detail-value">{data?.main?.humidity}%</span>
              </div>
              
              <div className="weather-detail-item">
                <span className="detail-label">💨 Wind Speed</span>
                <span className="detail-value">
                  {Math.round(data?.wind?.speed * (unit === "metric" ? 3.6 : 1))} {unit === "metric" ? "km/h" : "mph"}
                </span>
              </div>
              
              <div className="weather-detail-item">
                <span className="detail-label">🌡️ Pressure</span>
                <span className="detail-value">{data?.main?.pressure} hPa</span>
              </div>
              
              <div className="weather-detail-item">
                <span className="detail-label">👁️ Visibility</span>
                <span className="detail-value">{(data?.visibility / 1000).toFixed(1)} km</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;