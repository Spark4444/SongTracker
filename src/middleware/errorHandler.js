import WebError from "../WebError/WebError.js";

function errorHandler(err, req, res, next) {
    if (err instanceof WebError) {
        console.error(err);
        res.status(err.statusCode).render("error", { title: `Error ${err.statusCode}`, error: err.message });
    } else {
        console.error(err);
        res.render("error", { title: "Error 500", error: "Internal Server Error" });
    }
}

export default errorHandler;