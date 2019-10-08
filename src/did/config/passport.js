let JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

// load up the user model
let User = require('../models/user');
let config = require('./database'); // get db config file

module.exports = function (passport) {
    let opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = config.secret;
    passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
        // console.log('--------------------------------');
        // console.log(jwt_payload._doc)
        // console.log('--------------------------------');
        // 创建实际的Mongoose对象，便于后续处理
        User.findOne({_id: jwt_payload._doc._id}, function (err, user) {
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
};
