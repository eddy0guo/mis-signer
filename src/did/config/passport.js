// let JwtStrategy = require('passport-jwt').Strategy,
//     ExtractJwt = require('passport-jwt').ExtractJwt;

import PJWT from 'passport-jwt'

// load up the user model
import User from '../models/user'
import {local} from './database'

const JwtStrategy = PJWT.Strategy
const ExtractJwt = PJWT.ExtractJwt

export default (passport) => {
    let opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = local.secret;
    passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
        console.log('----------------JWT----------------');
        console.log(jwt_payload)
        console.log('----------------JWT----------------');
        // 创建实际的Mongoose对象，便于后续处理
        User.findOne({_id: jwt_payload._id}, function (err, user) {
            if (err) {
                return done(err, false);
            }
            if (user) {
                done(null, user);
            } else {
                done(null, false);
            }
            // console.log(user);
        });

    }));
}
