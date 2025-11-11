import WebError from "../WebError/WebError.js";
import generateNavLinks from "../functions/linkGenerator.js";
import session from "express-session";

function errorHandler(err, req, res, next) {
    const isLoggedIn = req.session && req.session.user ? true : false;
    const profileLink = isLoggedIn ? `/users/${req.session.user.id}` : "";
    const links = generateNavLinks(isLoggedIn, profileLink);
    if (err instanceof WebError) {
        console.error(err);
        res.status(err.statusCode).render("error", { title: `Error ${err.statusCode}`, error: err.message, links });
    } else {
        console.error(err);
        res.render("error", { title: "Error 500", error: "Internal Server Error", links });
    }
}

export default errorHandler;