// Utility function to wrap route handlers with try-catch
export default async function tryCatch(req, res, next, callback) {
    try {
        await callback(req, res);
    } catch (error) {
        next(error);
    }
}