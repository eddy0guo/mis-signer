const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');
const config = require('../config/database')

let UserSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    mnemonic: {
        type: String,
        required: true
    },
    id: {
        type: Number,
        required: true
    },
	asim_address: {
        type: String,
        required: true
    },

    btc_address: {
        type: String,
        required: true
    },
    eth_address: {
        type: String,
        required: true
    },
 
 
    mobile: String, // 绑定手机，一般同账户，需要唯一
    email: String,  // 绑定email，需要唯一
    nickname:String,
    avatar: String, // 头像地址
    amount: Number, // 账户余额
});

UserSchema.pre('save', function (next) {
    var user = this;
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }
            bcrypt.hash(user.password, salt, null, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});

UserSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};


global.db = mongoose.createConnection(config.database);

module.exports = db.model('User', UserSchema);
