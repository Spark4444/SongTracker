// Function to generate navigation links based on user authentication status
export default function generateNavLinks(isLoggedIn = false, isAdmin = false) {
    const links = [
        { href: "/", text: "Home" },
        { href: "/about", text: "About" },
        { href: "/songs/search", text: "Song Search" },
        { href: "/artists/search", text: "Artist Search" },
        { href: "/albums/search", text: "Album Search" }
    ];

    if (isAdmin) {
        links.push({ href: "/users", text: "User List" });
    }
    if (isLoggedIn) {
        links.push({ href: "/profile", text: "Profile" });
    } else {
        links.push({ href: "/login", text: "Login" });
        links.push({ href: "/register", text: "Register" });
    }

    return links;
}

export function generateNavLinksReq(req) {
    const isLoggedIn = req.session && req.session.user ? true : false;
    const isAdmin = req.session && req.session.user && req.session.user.role === "admin";
    return generateNavLinks(isLoggedIn, isAdmin);
}