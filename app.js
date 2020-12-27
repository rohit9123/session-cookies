require("dotenv").config();
const express=require('express');
const app=express();
const port=3000;
const mongoose=require('mongoose');
const session=require('express-session');
//storing session cookie in mongidbsession after session required
const MongoDBsession=require('connect-mongodb-session')(session);
const User=require('./model/user');
const bcrypt=require('bcrypt');  
const bodyParser=require('body-parser');



mongoose_uri="mongodb+srv://Rohit:EQ1hXC0hC2rGyXFH@cluster0.ywnv8.mongodb.net/test";
mongoose.connect(mongoose_uri,{useNewUrlParser:true,useUnifiedTopology:true});

//using store to save the cookie in database
const store=new MongoDBsession({
    uri:mongoose_uri,
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
    console.log(user.username);
    console.log(user.password);

    // res.redirect('/');
    const valid=await bcrypt.compare(password,user.password);
  
    if(valid){
        console.log('login')
        req.session.isLoggedIn=true;
        req.session.user=user._id;
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
    req.session.user._id=user._id;
    res.redirect('/secert');

})

// app.get('/edit',)

// app.get('/register',async(req,res)=>{
//     let username="rohit12";
//     let password='123456';
//     const hash=await bcrypt.hash(password,12);
//     const user=new User({
//         username:username,
//         password:hash
//     })
//     await user.save();
//     console.log(user);
//     res.send('succesful');

// })
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




app.listen(port,()=>{
    console.log('running at port: ',port);
})
