"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resend = void 0;
const _env_1 = require("http/_env");
const resend_1 = require("resend");
exports.resend = new resend_1.Resend(_env_1.env.RESEND_API_KEY);
