import WebError from "../WebError/WebError.js";
import session from "express-session";;
import { generateNavLinksReq } from "../functions/linkGenerator.js";

// Error handling middleware
function errorHandler(err, req, res, next) {
    const links = generateNavLinksReq(req);
    if (err instanceof WebError) {
        const { statusCode, previousPage } = err;
        console.error(err);
        res.status(statusCode).render("error", { title: `Error ${statusCode}`, error: err.message, links });
    } else {
        console.error(err);
        res.render("error", { title: "Error 500", error: "Internal Server Error", links });
    }
}

export default errorHandler;