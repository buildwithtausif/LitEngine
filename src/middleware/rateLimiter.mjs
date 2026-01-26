import {rateLimit, ipKeyGenerator } from "express-rate-limit";

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 100 requests per windowMs
    standardHeaders: true,      
    legacyHeaders: false,
    message: {
        status: 429,
        error: "Too Many Requests",
        message: "Too many requests from this IP, please try again after 15 minutes",
    },
    // explicitly limit by ip-address
    keyGenerator: (req, res) => {
        return ipKeyGenerator(req.ip);
    }
});

export default apiLimiter;