var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  ,	url = require('url')
  , path = (__dirname + '/public')
  , indexfiles = [];
  
list();  
app.listen(8080);


function handler (request, response) {

	var pathname = url.parse(request.url).pathname;

	console.log(path +  pathname);

	if(pathname == '/'){
		response.writeHead(200);
		indexfiles.forEach(function(file) {
			response.write('<a href="'+file+'">'+file+'</a><br />');
		})
		response.end();
	} else {
	fs.readFile(path + pathname, function (err, data) {
		if (err) {
		  response.writeHead(500);
		  return response.end('Error loading ' + pathname);
		}

		response.writeHead(200);
		response.end(data);
	});
	}
}
	

function list() {
	
	var dir = fs.readdirSync(path);
	dir.forEach(function(file) {
		if(file.indexOf('.html', file.length - 5) !== -1){
			indexfiles.push(file);
		}
	});
}


//Just using namespacing for the sake it of right now
//This is for the cursor sharing 
io.of('/cursorshare').on('connection', function (socket) {
  
  socket.on('cursor-update', function (data) {
		socket.broadcast.emit('cursor-position-update', data);
		console.log(data);
	});

});

//This is for the iphone cube control thingy
io.of('/cubecontrol').on('connection', function (socket) {
  
  socket.on('coord-change', function (data) {
		socket.broadcast.emit('coord-change', data);
		console.log(data);
	});

});

//This is for the iphone debug thingy
io.of('/debug').on('connection', function (socket) {
  
  socket.on('stuff', function (data) {
		socket.broadcast.emit('stuff', data);
		console.log(data);
	});

});
