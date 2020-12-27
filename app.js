const express=require('express');
const app=express();
const port=3000;
const mongoose=require('mongoose');
const session=require('express-session');
const User=require('./model/user');
const bcrypt=require('bcrypt');  




const mongoose_uri="mongodb+srv://Rohit:EQ1hXC0hC2rGyXFH@cluster0.ywnv8.mongodb.net/test";
mongoose.connect(mongoose_uri,{useNewUrlParser:true,useUnifiedTopology:true});

app.use(session({
    secret:'learning session',
    resave:true,
    saveUninitialized:true
}))





app.get('/',(req,res)=>{
    res.send('hello world');
});
app.get('/secert',(req,res)=>{
    if(req.session.isLoggedIn){
        res.send('sucess');
    }else{
        res.redirect('/');
    }
    
})
app.get('/user',async(req,res)=>{
    const username='rohit12';
    const password='123456';
    
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
        res.send(user);
       
    }else{
        res.send('loser');
    }
})
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


app.get('/session',(req,res)=>{
   
    res.send('session is set');
})




app.listen(port,()=>{
    console.log('running at port: ',port);
})
