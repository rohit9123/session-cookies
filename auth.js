const express=require('express');
const User=require('./model/user');
const router=express.Router();
const crypto=require("crypto");
const bcrypt=require('bcrypt');
const {body,validationResult}=require("express-validator");
//sending email
const nodemailer=require('nodemailer');
const sendgridTransport=require('nodemailer-sendgrid-transport');
const transporter=nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key:'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'
    }
}));

// console.log(req.session.isLoggedIn);
router.get('/login',(req,res)=>{
    res.render('login.ejs');
})
router.get('/register',(req,res)=>{
    res.render('register');
})

router.get('/secert',(req,res)=>{
    if(req.session.isLoggedIn){

        res.send('sucess');
    }else{
        res.redirect('/');
    }
    
})


router.post('/login',body('username').isEmail(),async(req,res)=>{
    const username=req.body.username;
    const password=req.body.password;
    console.log(username,password);

    const errors = validationResult(req);
    // if(error)
    if(!errors.isEmpty()){
        return res.status(404).json({errors:errors.array()});
    }
    
    User.findOne({username:username}).then(async user=>{
        if(!user){
            return res.redirect('/login');
        }
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

})

router.post('/register',body('username').isEmail(),body('password').isAlphanumeric().isLength({min:5}),async(req,res)=>{
    const username=req.body.username;
    const password=req.body.password;
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(404).json({errors:errors.array()});
    }
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

// router.get('/edit',)


router.get('/logout',(req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            res.send('something went wrong');
        }
        else{
            res.redirect('/');
        }
    })
})

router.get('/getreset',(req,res)=>{
    res.render('getreset')
})

router.post('/postreset',(req,res)=>{
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
router.get('/reset/:token',(req,res)=>{
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
router.post('/newpassword',(req,res)=>{
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

module.exports=router;