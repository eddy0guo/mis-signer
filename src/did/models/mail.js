const nodemailer = require('nodemailer');
let transporter = nodemailer.createTransport({
    service: 'qq', // qq,网易
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: "792130043@qq.com",
        pass: 'vsvnfrtignzcbcgd',
    }
});

let mail = {
    transporter: transporter,
    send(mail, content, callback) {
        let mailOptions = {
            from: '"MIST EXCHANGE" <792130043@qq.com>', 
            to: mail, // list of receivers
            subject: '获取验证码', // Subject line
            text: `${content}`, // plain text body
            html: `验证码为:${content},有效期为五分钟.` // html body   
        }

        this.transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                callback(-1); 
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            callback(1);
        });
    }
}
module.exports = mail;
