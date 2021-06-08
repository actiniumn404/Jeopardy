//Jeopardy by Andrew C. This is not affiliated in any way with Jeoardy or Sony Pictures Inc.
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const editJsonFile = require("edit-json-file");
let jsonfile = editJsonFile(`${__dirname}/json/community.json`);

var CODES = new Map()
var CHOSEN = new Map()
var pv = new Map()
var JSONCODE = new Map()
var communitynum = 0
/*var jsondict = new Map()*/

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.get('/community', (req, res) => {
  res.sendFile(__dirname + '/community.html');
});
app.get('/navbar', (req, res) => {
  res.sendFile(__dirname + '/navbar.html');
});
app.get('/play', (req, res) => {
  if (req.query.name.includes("\"") || req.query.name.includes('\'')){
    res.redirect("https://jeopardy.andrewchen51.repl.co/join?error=400+You+have+used+an+illegal+character")
  }
  if (!req.query.name && !req.query.code){
    res.send("<h1>400</h1><br>Bad Request. Requires game code and name.<br><a href='/join'>Return to join screen</a>")
  }
  else if (req.query.name && req.query.code &&CODES.has(parseFloat(req.query.code))){
    console.log(req.query.name+" connected at game code: "+req.query.code)
    res.sendFile(__dirname + '/play.html');
  }else if (!CODES.has(parseFloat(req.query.code))){
    res.redirect("https://jeopardy.andrewchen51.repl.co/join?error=404+Your+code+was+not+found+on+the+server")
  }
});
app.get('/host', (req, res) => {
  res.sendFile(__dirname + '/host.html');
});
app.get('/testgame.json', (req, res) => {
  res.sendFile(__dirname + '/json/testgame.json');
});
app.get('/testgamee.json', (req, res) => {
  res.sendFile(__dirname + '/json/testgamee.json');
});
app.get('/join', (req, res) => {
  res.sendFile(__dirname + '/join.html');
});
app.get('/admin', (req, res)=>{
  res.sendFile(__dirname + '/admin.html')
});
app.get('/save', (req, res)=>{
  jsonfile.set(communitynum, [req.query.jeopardyjson,req.query.jeopardyname,req.query.creatorname])
  console.log(jsonfile)
  communitynum++
  console.log(communitynum)
  jsonfile.save()
  res.redirect("/community")
});
io.on('connection', (socket) => {
  socket.on("host online confirm", (code)=>{
    ran = randint(10000, 99999)
    console.log(ran)
    CODES.set(ran, ran)
    io.emit('host id', ran)
    CHOSEN.set(ran.toString(), new Array())
  })
  socket.on('chat message', (msg) => {
    io.to(msg.substring(0, 5)).emit("chat message", msg.substring(5, msg.length))
  });
  socket.on("answer data", (data)=>{
    io.to(data.substring(0, 5)).emit("answer data", data.substring(5, data.length))
  })
  socket.on("json string", (jsonc)=>{
    JSONCODE.set(jsonc.substring(0, 5), jsonc.substring(5, jsonc.length))
    io.to(jsonc.substring(0, 5)).emit("json string", jsonc.substring(5, jsonc.length))
  })
  socket.on("question select", (data)=>{
    everythingwithoutcode = [data[1], data[2], data[3]]
    //Warning! firewall is very important **DO NOT REMOVE**
    if (pv.get(data[0]) === undefined){
      io.to(data[0]).emit("question select", everythingwithoutcode)
      pv.set(data[0], everythingwithoutcode)
    }
    else if (everythingwithoutcode.join("") !== pv.get(data[0]).join("")){ 
      io.to(data[0]).emit("question select", everythingwithoutcode)
      pv.set(data[0], everythingwithoutcode)
    }
  })
  socket.on("score", (data)=>{
    io.to(data.substring(0, 5)).emit("score", data.substring(5, data.length))
  })
  socket.on("check answer", (data)=>{
    io.to(data.substring(0, 5)).emit("check answer", data.substring(5, data.length))
  })
  socket.on("eval", (data)=>{
    io.to(data.substring(0, 5)).emit("eval", data.substring(5, data.length))
  })
  socket.on("host eval", (data)=>{
    try{
      socket.to(data.substring(0, 5).toString()).emit("host eval", data.substring(5, data.length))
    }catch(err){
      throw "sigh";
    }
  })
   socket.on("host choose next player", (data)=>{
     try{
      io.to(data.substring(0, 5).toString()).emit("host choose next player", data.substring(5, data.length))
     }catch(err){
      throw "test"; 
     }
  })
  socket.on("do_scores", (data)=>{
    newarray = new Array()
    for (var datathing=1;datathing<data.length;datathing++){
      newarray.push(data[datathing])
    }
    io.to(data[0]).emit("do_scores", newarray)
  })
  socket.on("nodejs eval", (command)=>{
    try{
      eval(command);
    }catch(err){
      console.log("there goes an error")
    }
  })
  socket.on("host user kick", (e)=>{
    io.to(e.substring(0, 5)).emit("host user kick", e.substring(5, e.length))
  })
  socket.on("unload", (code)=>{
    CODES.delete(parseFloat(code));
    pv.delete(code)
    try{
      CHOSEN.delete(code.toString());
    }
    catch{
      console.log("sigh what is the problem with you")
    }
    io.to(code).emit("eval", 'window.location.href = "/join?" + new URLSearchParams({error: "Your host disconnected!"});')
  })
  socket.on("request decks",(identificationid)=>{
    //decks will contain [dict of decks {num: [json code, list of jeopardy name, creator]}, verification id]
    console.log("json was requested")
    io.emit("decks sended",[jsonfile.toObject(),identificationid])
  })
});
io.emit('some event', { someProperty: 'some value', otherProperty: 'other value' })
http.listen(3000, () => {
  console.log('Server is online');
});

function randint(a, b){
    return Math.floor((Math.random() *  (b-a))-1)+a-1
}
app.get('/logo.png', (req, res)=>{
  res.sendFile(__dirname + '/logo.png')
})
app.get('/help', (req, res)=>{
  res.sendFile(__dirname + '/help.html')
})
app.get('/create', (req, res)=>{
  res.sendFile(__dirname + '/create.html')
})