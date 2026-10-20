import { useState, useEffect } from 'react'
import './App.css'
import Auth from './components/auth/Auth'
import Debug from './components/Debug'
import Nav from './components/Nav/Nav'
import All from './components/auth/All/All'

function App() {

	let [ debugValues, setDebugValues ] = useState("")
	let [ token, setToken ] = useState(() => localStorage.getItem("token"))

	
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
		<main className={ darkMode ? "dark-mode" : "light-mode"}>
			<Nav darkMode={darkMode} setDarkMode={setDarkMode} />
			{ token ? <All token={token} /> : <Auth setDebugValues={setDebugValues} setToken={setToken} />}
			{/* <Debug debugValues={debugValues} /> */}
		</main>
	)
}

export default App
