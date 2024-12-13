/**
 * @class --> Email Handler...
 *
 * this class helps us to manage everything related to the sneding of emails and different types
 * of emails...
 */
import { SERVER } from '../config/config';
import nodemailer, { Transporter } from 'nodemailer';


export default class EmailHandler{
    private email: string;
    private subject: string;
    private message: string;
    private host_name: any;
    private user: any;
    private pass: any;

    constructor(email: string, subject: string, message: string){
        this.email = email;
        this.subject = subject;
        this.message = message;
        this.host_name = SERVER.EHOST;
        this.user = SERVER.EUSER;
        this.pass = SERVER.EPASS;
    }

    // this function creats the transporter...
    private transporter(): Transporter{
        return nodemailer.createTransport({
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
    async emailSending(): Promise<number>{
        try {
            const transporter: Transporter = this.transporter();

            const response: any = await transporter.sendMail({
                from: this.user,
                to: this.email,
                subject: this.subject,
                html: this.message
            });

            console.log(`Successfully: ${response}`)
            return 1;
        } catch (error: any) {
            console.log(`Error sending email: ${error.message}`);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }
}