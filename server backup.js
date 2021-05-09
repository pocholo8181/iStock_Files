var express = require('express');
var morgan = require('morgan');
var path = require('path');
var Pool = require('pg').Pool;
var crypto = require('crypto');
var bodyParser = require('body-parser');
var session = require('express-session');

//database
var config = {
    user: 'postgres',
    database: 'poch',
    host: '',
    port: '5432',
    password: 123
};

var app = express();
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(session({
    secret: 'someSecretRandomValue',
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 30}
}));

function createTemplate (data){
    var title = data.title;
    var date = data.date;
    var heading = data.heading;
    var content = data.content;

    var htmlTelmplate = 
        `
        <!DOCTYPE html>
        <html>
            <head>
                <title>${title}</title>
                <link rel="stylesheet" href="/ui/style.css">
            </head>
            <meta name="viewport" content="width=device-width", initial-scale="1"/>
        
            <body>
                <div class="container">
                    <div>
                        <a href="/">Home</a>
                    </div>
        
                    </hr>
        
                    ${heading}
        
                    </hr>
        
                    <div>
                        ${date.toDateString()}
                    </div>
        
                    <div>
                        ${content}
                    </div>

                </div>
            </body>
        </html>
        `;
        return htmlTelmplate;
};

app.get('/', function (req, res){
    res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});

//for password hashing
function hash (input, salt){
    //how do we create da hash
    var hashed = crypto.pbkdf2Sync(input, salt, 10000, 512, 'sha512');
    return ["pbkdf2Sync", "10000", salt, hashed.toString('hex')].join('$');
}

app.get('/hash/:input', function (req, res){
    var hashedString = hash(req.params.input, 'this-is-some-random-string');
    res.send(hashedString);
});

//create user
app.post('/create-user', function(req, res){
    //username, password
    //{"username": "pocholo", "password: "password"}
    //JSON
    var username = req.body.username;
    var password = req.body.password;

    var salt = crypto.randomBytes(128).toString('hex');
    var dbString = hash(password, salt);
    pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, dbString/*password*/], function(err, result){
        if(err){
            res.status(500).send(err.toString());
        }
        //if no error
        else{
            res.send({"message": "User successfully created!"});
        }
    });

});

//login
app.post('/login', function(req, res){
    var username = req.body.username;
    var password = req.body.password;
    
    pool.query('SELECT * FROM users WHERE username=$1', [username], function(err, result){
        if(err){
            res.status(500).send(err.toString());
        }
        else{
            if(result.rows.length === 0){
                res.status(403).send({"error": "Username/Password is invalid"});
            }
            else{
                //match the password
                    var dbString = result.rows[0].password;
                    var salt = dbString.split('$')[2];
                    var hashedPassword = hash(password, salt);//create a hash based on pass submitted and its original salt

                    if(hashedPassword === dbString){

                        //set the session
                        req.session.auth = {userId: result.rows[0].id};
                        //set cookie w/ a session id
                        //internally, on the server side, it maps the session id to an object
                        //{auth: {userID}}

                        res.send({"message": "Login Success!"});
                    }
                    else{
                        res.status(403).send({"error": "Username/Password is invalid"});
                    }
            }
        }

    });
});

//check login
app.get('/check-login', function(req, res){
    if(req.session && req.session.auth && req.session.auth.userId){
        res.send('You are logged in: '+req.session.auth.userId.toString());
    }
    else{
        res.send('You are not logged in');
    }
});

app.get('/logout', function (req, res){
    delete req.session.auth;
    res.send('Logged out');
});

//connect database
var pool = new Pool(config);
app.get('/test-db', function(req, res){
    //make a select request 
    //return a response with the results
    pool.query('SELECT * FROM users', function (err, result){
        //if theres error
        if(err){
            res.status(500).send(err.toString());
        }
        //if no error
        else{
            res.send(JSON.stringify(result.rows));
        }
    });
});

app.get('/ui/style.css', function (req, res){
    res.sendFile(path.join(__dirname, 'ui', 'style.css'));
});

app.get('/ui/main.js', function (req, res){
    res.sendFile(path.join(__dirname, 'ui', 'main.js'));
});

//
app.get('/articles/:articleName', function (req, res){
    
    //SELECT * FROM article WHERE title = "'"; DELETE WHERE a = 'asdf'
    //prevents random sql query
    pool.query("SELECT * FROM article WHERE title = $1", [req.params.articleName], function (err, result){
        //if theres error
        if(err){
            res.status(500).send(err.toString());
        }
        else{

            if(result.rows.length === 0){
                res.status(404).send('Article not found');
            }
            else{
                var articleData = result.rows[0];
                res.send(createTemplate(articleData));
            }
        }
    });


});

//inputs
var names = [];
app.get('/submit-name', function (req, res){
    //get the name from the req obj
    var name = req.query.name;

    names.push(name);
    //JSON: Javascript Object Notation
    res.send(JSON.stringify(names));

});


var port = 8080; //port
app.listen(port, function(){
    console.log(`Port: ${port}!`);
});
