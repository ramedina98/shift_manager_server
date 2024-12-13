/**
 * @module forgotPassword
 *
 * This file has a specific function that helps me format the email in a secure style, showing only the
 * first letter and the last two characters before the @ symbol...
 */

function replaceLetters(str: string): string{
    const size = str.length - 3;
    return '*'.repeat(size);
}

export function secureEmailtoShow(email: string): string | number{
    const [localPart, domainPart] = email.split('@');

    // verify that the email is valid and that the local part is at leats 3 characters long...
    if(!localPart || localPart.length < 3){
        return 1; // this menas that the message has to be diferent..
    }

    // get the first character and the 2 last characters....
    const mask: string = replaceLetters(localPart);
    const formattedLocal = `${localPart[0]}${mask}${localPart.slice(-2)}`;

    // returns the email...
    return `${formattedLocal}@${domainPart}`;
}