// Function to generate navigation links based on user authentication status
export default function generateNavLinks(isLoggedIn = false) {
    const links = [
        { href: "/", text: "Home" },
        { href: "/about", text: "About" },
        { href: "/users", text: "User List" },
        { href: "/songs/search", text: "Songs Search" },
        { href: "/artists/search", text: "Artists Search" },
        { href: "/albums/search", text: "Albums Search" }
    ];

    if (isLoggedIn) {
        links.push({ href: "/profile", text: "Profile" });
        links.push({ href: "/logout", text: "Logout" });
    } else {
        links.push({ href: "/login", text: "Login" });
        links.push({ href: "/register", text: "Register" });
    }

    return links;
}

export function generateNavLinksReq(req) {
    const isLoggedIn = req.session && req.session.user ? true : false;
    return generateNavLinks(isLoggedIn);
}