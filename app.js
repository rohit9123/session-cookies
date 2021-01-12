require("dotenv").config();
const express=require('express');
const app=express();
const port=3000;
const crypto=require("crypto");
const mongoose=require('mongoose');
const session=require('express-session');
//storing session cookie in mongidbsession after session required
const MongoDBsession=require('connect-mongodb-session')(session);
const User=require('./model/user');
const bcrypt=require('bcrypt');  
const bodyParser=require('body-parser');
global.Buffer = global.Buffer || require("buffer").Buffer;
//sending emails
const nodemailer=require('nodemailer');
const sendgridTransport=require('nodemailer-sendgrid-transport');
const user = require("./model/user");
const { request } = require("http");

const transporter=nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key:'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'
    }
}));
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
    store:store
}))

app.use(bodyParser.urlencoded({extended:true}))



app.get('/',(req,res)=>{
    res.send('hello world');
});

app.get('/login',(req,res)=>{
    res.render('login.ejs');
})
app.get('/register',(req,res)=>{
    res.render('register');
})

app.get('/secert',(req,res)=>{
    if(req.session.isLoggedIn){
        res.send('sucess');
    }else{
        res.redirect('/');
    }
    
})


app.post('/login',async(req,res)=>{
    const username=req.body.username;
    const password=req.body.password;
    
    const user=await User.findOne({username});
    if(user===null){
        res.redirect('/login');
    }
    console.log(user.username);
    console.log(user.password);

    // res.redirect('/');
    const valid=await bcrypt.compare(password,user.password);
  
    if(valid){
        console.log('login')
        req.session.isLoggedIn=true;
        req.session.user=user;
        req.session.save(err=>{
            console.log(err+"fkf");
        })
        console.log(req.session.user);
        res.redirect('/secert')
       
    }else{
        res.send('loser');
    }
})

app.post('/register',async(req,res)=>{
    const username=req.body.username;
    const password=req.body.password;

    const hash=await bcrypt.hash(password,12);
    const user=await new User({
        username:username,
        password:hash
    })
    await user.save();
    req.session.isLoggedIn=true;
    req.session.user=user;
    req.session.save(err=>{
        console.log(err);
    })
    // req.session.user._id=user._id;
    //sending email//
    transporter.sendMail({
        to:username,
        from:"rohitkumpan14@gmail.com",
        subject:"signup succesfully",
        html:'<h1>you succesfully signed up!</h1>'
    })
    //sending email
    res.redirect('/secert');

})

// app.get('/edit',)


app.get('/logout',(req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            res.send('something went wrong');
        }
        else{
            res.redirect('/');
        }
    })
})

app.get('/session',(req,res)=>{
   
    res.send('session is set');
})
app.get('/getreset',(req,res)=>{
    res.render('getreset')
})

app.post('/postreset',(req,res)=>{
    let user=req.body.username;
    crypto.randomBytes(32,(err,buff)=>{
        if(err){
            console.log(err);
            res.redirect('/getreset');
        }
        const token=buff.toString('hex');
        User.findOne({username:user}).then(user=>{
            if(!user){
               return res.redirect('/getreset');
            }
            user.resetToken=token;
            user.resetTokenExpiration=Date.now()+3600000;
            return user.save();
        }).then(result=>{
            res.redirect('/');
            transporter.sendMail({
                to:user,
                from:'rohitkumpan14@gmail.com',
                subject:'password reset',
                html:`<p>you requested a password reset</p>
                <p>click this <a href="http://localhost:3000/reset/${token}">link</a>`
            })
        })   
    })
    
   
})
app.get('/reset/:token',(req,res)=>{
    const token=req.params.token;
    User.findOne({resetToken:token,resetTokenExpiration: {$gt:Date.now()}}).then(user=>{
        if(!user){
            return res.redirect('/');
        }
        console.log(user);
        res.render('newpassword',{userId:user._id.toString(),
        passwordToken:token})
    })

})
app.post('/newpassword',(req,res)=>{
    const newpassword=req.body.password;
    const userId=req.body.userId;
    const passwordToken=req.body.passwordToken;
    let resetuser,newpass;
    user.findOne({resetToken:passwordToken,resetTokenExpiration:{$gt: Date.now()},
    _id:userId})
    .then(user=>{
        resetuser=user;
        return bcrypt.hash(newpassword,12);
    }).then(hashedPassword=>{
        resetuser.password=hashedPassword;
        resetuser.resetToken=undefined;
        resetuser.resetTokenExpiration=undefined;
        return resetuser.save();
    }).then(result=>{
        res.redirect('/login');
    })
})

app.listen(port,()=>{
    console.log('running at port: ',port);
})
