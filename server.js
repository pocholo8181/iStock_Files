var express = require('express');
var morgan = require('morgan');
var path = require('path');
var Pool = require('pg').Pool;
var crypto = require('crypto');
var bodyParser = require('body-parser');
var session = require('express-session');

var app = express();

//stuffs
app.get('/', function (req, res){
    res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});

app.get('/ui/dashboard.html', function (req, res){
    res.sendFile(path.join(__dirname, 'ui', 'dashboard.html'));
});

//Styles
app.get('/ui/style.css', function (req, res){
    res.sendFile(path.join(__dirname, 'ui', 'style.css'));
});

app.get('/ui/loginstyle.css', function (req, res){
    res.sendFile(path.join(__dirname, 'ui', 'loginstyle.css'));
});

//Pictures
app.get('/ui/logo.png', function (req, res){
    res.sendFile(path.join(__dirname, 'ui', 'logo.png'));
});

//Javascripts
app.get('/ui/burger.js', function (req, res){
    res.sendFile(path.join(__dirname, 'ui', 'burger.js'));
});


var port = 8080; //port
app.listen(port, function(){
    console.log(`Port: ${port}!`);
});
