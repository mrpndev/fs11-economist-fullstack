import React from "react";
import "./nav.css";

/* 
	? Challenge
	* change the styling of the app by clicking the button
	* the button should say Light Mode if darkMode is true
	* the button should say Dark Mode if darkMode is false
	* the button should affect the styling of the entire app to change the mode
	
*/

export default function Nav({ darkMode, setDarkMode }) {
	return (
		<nav>
			<button onClick={() => setDarkMode(!darkMode)}>{ darkMode ? "Light Mode" : "Dark Mode"}</button>
		</nav>
	);
}
