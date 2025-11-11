// Function to generate navigation links based on user authentication status
export default function generateNavLinks(isLoggedIn = false, profileLink = "") {
    const links = [
        { href: "/", text: "Home" },
    ];

    if (isLoggedIn) {
        links.push({ href: profileLink, text: "Profile" });
        links.push({ href: "/logout", text: "Logout" });
    } else {
        links.push({ href: "/login", text: "Login" });
        links.push({ href: "/register", text: "Register" });
    }

    return links;
}