require('dotenv').config();
const path = require("path");
const express = require("express");
const compression = require("compression");
const favicon = require("serve-favicon");
const mongoose = require('mongoose');
const expressHandlebars = require('express-handlebars');
const helmet = require('helmet');
const session = require('express-session');
const RedisStore = require('connect-redis').RedisStore;
const redis = require('redis');

const router = require('./router.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const dbURI = process.env.MONGODB_URI || 'mongodb://localhost/DomoMaker';
mongoose.connect(dbURI).catch((err) => {
    if (err) {
        console.log('Could not connect to database');
        throw err;
    }
});

const redisClient = redis.createClient({ 
    url: process.env.REDISCLOUD_URL 
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

redisClient.connect().then(() => {
const app = express();
app.use(helmet());
app.use('/assets', express.static(path.resolve(`${__dirname}/../hosted`)));
app.use(favicon(`${__dirname}/../hosted/img/favicon.png`));
app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    key: 'sessionid',
    store: new RedisStore({ client: redisClient }),
    // The secret is a private string used as a seed for hashing/creating unique session
    // keys. This makes it so your unique session keys are different from other servers
    // using express. The secret can be changed to anything you want, but will invalidate
    // existing session ids (which isn’t necessarily a huge issue)
    secret: 'Domo Arigato',
    // The resave option set to false tells the session library to only send the session key
    // back to the database if it changes. If it were set to true, we would generate a lot of
    // database requests that were unnecessary.
    resave: false,
    // The saveUninitialized option set to false prevents us from saving uninitialized
    // sessionids to the database.
    saveUninitialized: false,
}));

app.engine('handlebars', expressHandlebars.engine({ defaultLayout: '' }));
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/../views`);

router(app);

app.listen(port, (err) => {
    if (err) { throw err; }
    console.log(`Listening on port ${port}`);
});
});

