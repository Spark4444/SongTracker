import WebError from "../utils/WebError.js";

export function auth(req, res, next) {
    if (req.session && req.session?.user?.id) {
        next();
    } else {
        next(new WebError("You must be logged in to access this page.", 401));
    }
}

export function alreadyAuth(req, res, next) {
    if (req.session && req.session?.user?.id) {
        next(new WebError("You are already logged in.", 400));
    } else {
        next();
    }
}

export function adminAuth(req, res, next) {
    if (req.session && req.session?.user?.role === "admin") {
        next();
    } else {
        next(new WebError("You do not have permission to access this page.", 403));
    }
}