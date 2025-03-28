"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_PROTHEUS_DATA_URL = exports.API_PROTHEUS_FIN_URL = void 0;
const axios_1 = __importDefault(require("axios"));
const _env_1 = require("http/_env");
exports.API_PROTHEUS_FIN_URL = axios_1.default.create({
    baseURL: _env_1.env.API_PROTHEUS_FIN_URL,
});
exports.API_PROTHEUS_DATA_URL = axios_1.default.create({
    baseURL: _env_1.env.API_PROTHEUS_DATA_URL,
});
