// Utility function to wrap route handlers with try-catch
export default function tryCatch(req, res, next, callback) {
    try {
        callback(req, res);
    } catch (error) {
        next(error);
    }
}