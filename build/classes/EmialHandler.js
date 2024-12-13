"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @class --> Email Handler...
 *
 * this class helps us to manage everything related to the sneding of emails and different types
 * of emails...
 */
const config_1 = require("../config/config");
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailHandler {
    constructor(email, subject, message) {
        this.email = email;
        this.subject = subject;
        this.message = message;
        this.host_name = config_1.SERVER.EHOST;
        this.user = config_1.SERVER.EUSER;
        this.pass = config_1.SERVER.EPASS;
    }
    // this function creats the transporter...
    transporter() {
        return nodemailer_1.default.createTransport({
            host: this.host_name,
            port: 465,
            secure: true,
            auth: {
                user: this.user,
                pass: this.pass
            }
        });
    }
    // this function does the email sending...
    emailSending() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transporter = this.transporter();
                const response = yield transporter.sendMail({
                    from: this.user,
                    to: this.email,
                    subject: this.subject,
                    html: this.message
                });
                console.log(`Successfully: ${response}`);
                return 1;
            }
            catch (error) {
                console.log(`Error sending email: ${error.message}`);
                throw new Error(`Failed to send email: ${error.message}`);
            }
        });
    }
}
exports.default = EmailHandler;
