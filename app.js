var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver');
const { title } = require('process');


var app = express();
app.set('views' , path.join (__dirname , 'views'));
app.set('view engine' , 'ejs');

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('viewss', __dirname);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : false }));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname , 'public')));

var driver = neo4j.driver('bolt://localhost:7687' , neo4j.auth.basic('admin' , '12345' ));
var session = driver.session();
var session2 = driver.session();


app.get('/' , function( req , res ){
    session
        .run('MATCH (n:Movie) RETURN n LIMIT 30')
        .then(function(result){
            var movieArr = [];
            result.records.forEach(function(record){
                //console.log(record._fields[0].properties)
                movieArr.push({
                    id: record._fields[0].identity.low,
                    title: record._fields[0].properties.title,
                    year: record._fields[0].properties.year
                });
            });

            session
                .run('MATCH (n:Person) RETURN n LIMIT 30')
                .then(function(result2){
                    var actorArr = [];
                    result2.records.forEach(function(record){
                        actorArr.push({
                            id: record._fields[0].identity.low,
                            name: record._fields[0].properties.name
                        });
                    });
                    res.render('index' , {
                        movies: movieArr,
                        actors: actorArr
                    });
                })
                .catch(function(err){
                    console.log(err)
                });
            }).catch(function(err){
            console.log(err);
        })
});

app.post( '/movie/add', function ( req , res ){
    var title = req.body.movie_title;
    var reseased = req.body.movie_released;
    var tagline = req.body.movie_tagline;

    const session = driver.session();
    session
        .run('CREATE(n:Movie {title:$titleParam, reseased:$reseasedParam , tagline:$taglineParam }) RETURN n.title', {titleParam:title , reseasedParam:reseased , taglineParam:tagline})
        .then(function(result){
            res.redirect('/');
            session.close();
        })
        .catch(function(err){
            console.log(err);
        })
})

app.post( '/person/add', function ( req , res ){
    var name = req.body.person_name;
    var born = req.body.person_born;
    const session = driver.session();
    session
        .run('CREATE(n:Person {name:$nameParam, born:$bornParam }) RETURN n.name', {nameParam:name , bornParam:born})
        .then(function(result){
            res.redirect('/');
            session.close();
        })
        .catch(function(err){
            console.log(err);
        })
})




app.post( '/movie/person/add', function ( req , res ){
    var title = req.body.movie_person_title;
    var name = req.body.movie_person_name;

    const session = driver.session();

    session
        .run('MATCH(n:Person {name:$nameParam}), (m:Movie{title:$titleParam}) MERGE(n)-[r:ACTED_IN]-(m) RETURN n,m', {nameParam:name , titleParam:title})
        .then(function(result){
            res.redirect('/');
            session.close();
        })
        .catch(function(err){
            console.log(err);
        })
})


app.post( '/movie/delete', function ( req , res ){
    var title = req.body.delete_movie;

    const session = driver.session();

    session
        .run('MATCH (n:Movie {title:$titleParam}) DELETE n', { titleParam:title})
        .then(function(result){
            res.redirect('/');
            session.close();
        })
        .catch(function(err){
            console.log(err);
        })
})



app.listen(3000);
console.log('El servidor se ha iniciado en el puerto 3000');

module.exports = app;


