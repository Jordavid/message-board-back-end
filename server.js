var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');

const messages = require('./data/messages.json');
const users = require('./data/users.json');

const port = 3000;
var app = express();

app.use(bodyParser.json());
app.use(cors());

app.use(function(req, res, next) {
    console.log(`${req.method} request for ${req.url}`);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

app.get('/', (req, res) => {
    res.send('Welcome to Message Board Back-end Server');
});
// Start of Route for Web Services
var api = express.Router();
var auth = express.Router();

api.get('/messages', (req, res) => {
    res.json(messages);
});

api.post('/messages', (req, res) => {
    if(req.body.body !== "" && req.body.owner !== ""){
        messages.unshift(req.body);
        res.json(req.body);
    }
});

api.get('/users', (req, res) => {
    res.json(users);
});

api.get('/users/me', checkAuthenticated,  (req, res) => {
    res.json(users[req.user - 1]);
});

api.post('/users/me', checkAuthenticated,  (req, res) => {
    let user = users[req.user - 1];

    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;

    res.json(user);
});

auth.post('/register', (req, res) => {
    if(req.body.firstName !== "" && req.body.lastName !== "" && req.body.email !== "" && req.body.password !== "" && req.body.confirmPassword !== ""){
        let index = users.push(req.body);
        let user = users[index - 1];
        user.id = index;
        sendToken(user, res);
    }
});

auth.post('/login', (req, res) => {
    if(req.body.email !== "" && req.body.password !== ""){
        let user = users.find( user => user.email == req.body.email);

        if(!user){
            sendError(res);
        } else {
            if(user.password === req.body.password){
                sendToken(user, res);
            } else {
                sendError(res);
            }
        }
    }
});

function sendError(res) {
    res.json({success: false, message:"Email or Password Incorrect"});
}

function sendToken(user, res) {
    let token = jwt.sign(user.id, '123');
    res.json({firstName: user.firstName, token: token});
}

function checkAuthenticated(req, res, next) {
    if(!req.header('authorization')){
        return res.status(401).send({message: "Unauthorized requested. Missing authentication header."});
    } else {
        var token = req.header('authorization').split(' ')[1];
        var payload = jwt.decode(token, '123');

        if(!payload) {
            return res.status(401).send({message: "Unauthorized request. The Authentication header is invalid"});
        } else {
            req.user = payload;
            next();
        }
    }
}

app.use('/api', api);
app.use('/auth', auth);
// End of Route for Web Services

app.listen(port, () => {
    console.log(`Message Board server running on http://localhost:${port}`);
});