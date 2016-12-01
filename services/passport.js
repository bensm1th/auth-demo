const   passport        = require('passport'),
        User            = require('../models/user'),
        config          = require('../config'),
        JwtStrategy     = require('passport-jwt').Strategy,
        ExtractJwt      = require('passport-jwt').ExtractJwt,
        localStrategy   = require('passport-local');

// Create local strategy (local refers to our database)
// the first argument is the options, so I'll separate that out. Its expects that a username will be on the username 
// -- property of the request.  Since we aren't using usernames, we are going to pass in options that tell it to look
// -- for the username under the email field.  
const localOptions = {
    usernameField: 'email'
}

// after the localStrategy parses the request, it pulls out the email and the password, and hands it to us in a callback
const localLogin = new localStrategy(localOptions, function(email, password, done) {
// verify email and password, call 'done' with the user 
// if it is the correct email and password, 
// otherwise, call 'done' with false
    User.findOne( { email }, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        // compare passwords - is 'password' equal to user.password? But, our stored password is hashed and salted
        // we need to compare an encrypted password with a normal one
        user.comparePassword(password, function(err, isMatch) {
            if (err) { return done(err); }
            if (!isMatch) { return done(null, false); }

            return done(null, user);
        });
    });
});

//Setup options for JwtStrategy
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromHeader('authorization'),
    secretOrKey: config.secret
};  
//Create JwtStrategy
// payload is the decoded jwtToken, 
// done is a callback function that we need to call depending on whether we can authenticate the user
const jwtLogin = new JwtStrategy(jwtOptions, function(payload, done) {
    //see if the user ID and the payload exists in our database, 
    //if it does, call done with that user, 
    //otherwise, call done without a user object
    User.findById(payload.sub, function(err, user) {
        if (err) { return done(err, false); }

        if (user) {
            done(null, user);
        } else {
            done(null, false);
        }
    })
})

// Tell passport to use this strategy
passport.use(jwtLogin);
passport.use(localLogin);