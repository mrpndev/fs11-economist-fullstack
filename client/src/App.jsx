import { useState, useEffect, useCallback } from 'react'
import './App.css'
import Auth from './components/auth/Auth'
import Nav from './components/Nav/Nav'
import All from './components/All/All'

function App() {

	let [ , setDebugValues ] = useState("")
	let [ token, setToken ] = useState(() => localStorage.getItem("token"))
	const clearToken = useCallback(() => {
		localStorage.removeItem("token")
		setToken(null)
	}, [])

	
	/* 
	? Off topic (kinda) challenge
	* Now that you know how to use localstorage...
	* update the dark mode/light mode to also set a value in the browser
	* when the page loads, it should try and read a setting in the browser and set it accordingly
	*/
	
	// read the saved value from localstorage
	// we need to "true" "false" because stored as string in localstorage, not boolena
	let [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true")
	// above runs when app first loads and starts as dark mode if true

	useEffect(() => {
		// when darkMode changes, we set the item. reload triggers it
		localStorage.setItem("darkMode", String(darkMode))
	}, [darkMode])

	return (
		<main className={`app-shell ${darkMode ? "dark-mode" : "light-mode"}`}>
			<Nav darkMode={darkMode} setDarkMode={setDarkMode} hasToken={Boolean(token)} onLogout={clearToken} />
			{ token ? <All token={token} onLogout={clearToken} /> : <Auth setDebugValues={setDebugValues} setToken={setToken} />}
			{/* <Debug debugValues={debugValues} /> */}
		</main>
	)
}

export default App
