import { apierror } from "../utils/apierror.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof apierror)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || "Something went wrong";
        error = new apierror(statusCode, message, error?.errors || [], error.stack);
    }

    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {})
    };

    return res.status(error.statusCode).json(response);
};

export { errorHandler };
