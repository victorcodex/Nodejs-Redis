const express = require('express')
const redis = require('redis')
var bodyParser = require('body-parser');
client = redis.createClient();
const app = express()
var async = require("async");

var postParser = bodyParser.json();
var jsonParser = bodyParser.urlencoded({ extended: true })

var id = 1;
var storeKeys = [];
var storeData = [];
var rs = null;

app.use(express.static('public'))

app.get('/users', (req, res) => {
	client.keys("*", function(err, keys){
		if(keys.length == 0){ res.json({status: 204, 'message': 'No Content'}); return; }
		async.map(keys, function(ky, next){
			client.get(ky, function(err, reply){
				if(reply !== null){
					try{
						var json = JSON.parse(reply);
						json.id = ky;
						next(null, json);
					}
					catch(e){ next(true, null); }
				}else{
					next(true, null);
				}
			});
		}, function(err, results) {
				res.json( results );
		});
		
	});
})
app.get('/users/:id', jsonParser, (req, res) => {
	client.get(req.params.id, function(err, reply){
		if(reply !== null){
			try{
				var json = JSON.parse(reply);
				res.json(json);
			}
			catch(e){
				res.json({status: 404, message:'Object not found'});
			}
		}else{
			res.json({status: 404, message:'Object not found'});
		}
	});
})
app.post('/users', [jsonParser, postParser], (req, res) => {
	if(!req.body){ res.json({status: 401, message:'You cannot save empty data'}); return; }
	if(Object.keys(req.body).length == 0){ res.json({status: 401, message:'You cannot save empty data'}); return; }
	
	res.json({status: 200, message:'user record created', id: "key" + id.toString()});
	
	client.set("key" + id.toString(), JSON.stringify(req.body));
	id++;
})
app.put('/users/:id', [jsonParser, postParser], (req, res) => {
	client.get(req.params.id, function(err, reply){
		if(reply !== null){
			try{
				var json = JSON.parse(reply);
				var kys = Object.keys(req.body);
				for(var i in kys){
					var key = kys[i];
					var val = req.body[key];
					
					json[ key ] = val;
				}
				
				client.set( req.params.id, JSON.stringify( json ));
				res.json({status: 200, message:'user Updated'});
			}
			catch(e){
				res.json({status: 404, message:'Object not found'});
			}
		}else{
			res.json({status: 404, message:'Object not found'});
		}
	});
})
app.delete('/users/:id', jsonParser, (req, res) => {
	client.get(req.params.id, function(err, reply){
		if(reply !== null){
			client.del( req.params.id, function(err, reply){
				res.json({status: 200, message: 'User ' + req.params.id + " deleted"});
			});
		}
		else{
			res.json({status: 404, message:'Object not found'});
		}
	});
})

function getKeys( cb ){
	if( storeKeys.length == 0 && storeData.length == 0){
		if(typeof cb == "function"){ cb(true, null); return;}
		else{ return; }
	}
	if( storeKeys.length == 0 && storeData.length > 0){
		if(typeof cb == "function"){ cb(true, storeData); return;}
		else{ return; }
	}
	
	var k = storeKeys.pop();
	client.get(k, function(err, reply){
		if(reply !== null){
			try{
				var json = JSON.parse(reply);
				storeData[ storeData.length ] = json;
			}
			catch(e){}
			
			if( storeKeys.length > 0){ getKeys(cb); }
		}
		else{
			res.json({status: 404, message:'Object not found'});
		}
	});
}

app.get('/', (req, res) => {
	res.send(" GET /users - List All Users <br /> GET /users/:id - Get Single user details <br /> POST /users - Create New User Entry <br /> PUT /users/:id - Update User details <br /> Delete /users/:id - Delete User Entry");
});
app.listen(3000, () => console.log('listening on port 3000'));