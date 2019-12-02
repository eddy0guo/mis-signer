const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');
import {local_db,origin_db} from './db'

let UserSchema = new Schema({
    username: {        //手机或者邮箱
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
	address: {
        type: String,
        required: true
    },
    mobile: String, // 绑定手机，一般同账户，需要唯一
    email: String,  // 绑定email，需要唯一
    nickname:String,
    avatar: String, // 头像地址
	home_address: String, //kyc家庭住址
	identity_card: String, //身份证
	name:String  //姓名
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

let local_user = local_db.model('fingo_user', UserSchema);
let origin_user = origin_db.model('fingo_user', UserSchema);

export {local_user,origin_user}
