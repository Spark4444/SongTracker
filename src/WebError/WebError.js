export default class WebError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = "WebError";
        this.statusCode = statusCode;
    }
}