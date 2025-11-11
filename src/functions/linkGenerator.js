// Function to generate navigation links based on user authentication status
export default function generateNavLinks(isLoggedIn = false, profileLink = "") {
    const links = [
        { href: "/", text: "Home" },
        { href: "/about", text: "About" },
        { href: "/users", text: "User List" },
        { href: "/songs", text: "Song List" },
        { href: "/artists", text: "Artist List" },
        { href: "/albums", text: "Album List" }
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

export function generateNavLinksReq(req) {
    const isLoggedIn = req.session && req.session.user ? true : false;
    const profileLink = isLoggedIn ? `/users/${req.session.user.email}` : "";
    return generateNavLinks(isLoggedIn, profileLink);
}