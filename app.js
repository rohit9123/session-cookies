require("dotenv").config();
const express=require('express');
const app=express();
const port=3000;
const crypto=require("crypto");
const path=require('path');
const mongoose=require('mongoose');
const session=require('express-session');
//storing session cookie in mongidbsession after session required
const MongoDBsession=require('connect-mongodb-session')(session);
const User=require('./model/user');
const bcrypt=require('bcrypt');  
const bodyParser=require('body-parser');
global.Buffer = global.Buffer || require("buffer").Buffer;
//sending emails
const Photo=require('./model/photo');
const user = require("./model/user");
const { request } = require("http");
const authroutes=require('./auth')
const photo=require('./photo');
const multer=require('multer');

// const { endsWith } = require("sequelize/types/lib/operators");

//sending emails
////
//using env to safe our database information from outside
mongoose.connect(process.env.mongoose_uri,{useNewUrlParser:true,useUnifiedTopology:true});

//using store to save the cookie in database
const store=new MongoDBsession({
    uri:process.env.mongoose_uri,
    collection:'mysession',
})
app.set('view engine','ejs');
app.set('views','views');
app.use(session({
    secret:'learning session',
    resave:false,
    saveUninitialized:false,
    store:store,
    maxage:3600000
}))


const filestorage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'photo');
    },
    filename:(req,file,cb)=>{
        cb(null,new Date().toISOString()+'-'+file.originalname);
    }
})

const fileFilter = (req,file,cb)=>{
    if(file.mimetype==='image/png'||file.mimetype==='image/jpg'||file.mimetype==='image/jpeg'){
        cb(null,true);
    }else{
        cb(null,false);
    }
}

app.use(bodyParser.urlencoded({extended:true}))


//the name of form file is have the name under the single
app.use(multer({storage:filestorage}).single('photo'))
app.use('/photo',express.static(path.join(__dirname,'photo')));

function islogin(req,res,next){
    if(req.session.isLoggedIn){
        next();
        
    }else{
    res.redirect('/login');
   }
}
app.get('/',(req,res)=>{
    let ans=Photo.find({},(err,photos)=>{
        if(err){
            res.send('hlw')
        }else{
            res.render('home',{photos:photos})
        }
    });
    
});

app.use(authroutes);
app.use(photo);

app.listen(port,()=>{
    console.log('running at port: ',port);
})
