// Web error class to handle HTTP errors
export default class WebError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = "WebError";
        this.statusCode = statusCode;
    }
}