import WebError from "../utils/webError.js";
import { generateNavLinksReq } from "../utils/linkGenerator.js";

// Error handling middleware
function errorHandler(err, req, res, next) {
    // Check if request expects JSON response (from fetch)
    const expectsJson = req.headers.accept && req.headers.accept.includes('application/json');
    
    if (err instanceof WebError) {
        const { statusCode, previousPage } = err;
        console.error(err);
        
        if (expectsJson) {
            res.status(statusCode).json({ success: false, message: err.message });
        } else {
            const links = generateNavLinksReq(req);
            res.status(statusCode).render("error", { title: `Error ${statusCode}`, error: err.message, links });
        }
    } else {
        console.error(err);
        
        if (expectsJson) {
            res.status(500).json({ success: false, message: "Internal Server Error" });
        } else {
            const links = generateNavLinksReq(req);
            res.status(500).render("error", { title: "Error 500", error: "Internal Server Error", links });
        }
    }
}

export default errorHandler;