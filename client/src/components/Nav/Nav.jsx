import "./nav.css";

/* 
	? Challenge
	* change the styling of the app by clicking the button
	* the button should say Light Mode if darkMode is true
	* the button should say Dark Mode if darkMode is false
	* the button should affect the styling of the entire app to change the mode
	
*/

export default function Nav({ darkMode, setDarkMode, hasToken, onLogout }) {
	return (
		<nav className="topbar">
			<a className="brand" href="/" aria-label="Economist home"><span className="brandMark">E</span><span>economist<span className="brandDot">.</span></span></a>
			<div className="topbarRight"><span className="liveStatus"><span className="statusDot" /> Live data</span>{hasToken && <button className="logoutButton" onClick={onLogout}>Sign out</button>}<button className="themeToggle" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle color theme">{darkMode ? "☼" : "☾"}</button></div>
		</nav>
	);
}
