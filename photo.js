const express=require('express');
const router=express.Router();
const mongoose=require("mongoose");
const fs=require('fs');
const path=require('path');
const {body,validationResult}=require("express-validator");
const User=require('./model/user'); 
const Photo=require('./model/photo');
const { findById } = require('./model/user');
const e = require('express');
// const e = require('express');
ObjectID = require("mongodb").ObjectID 


//this is for deleting a file from file system
const deletefile=(imageurl)=>{
    fs.unlink(imageurl,(err)=>{
        console.log(err);
    })
}
router.get('/add',islogin,(req,res)=>{
    // if(req.session.isLoggedIn)
    res.render('add');
    // else
    // res.redirect('/login');
})

router.post('/add',body('desc').isString().isLength({min:10}),async(req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(404).json({errors:errors.array()});
    }
    let photo=req.file;
    let desc=req.body.desc;
    if(!photo){
        res.render('/add');
    }
     const photoUrl=req.file.path ;
    if(req.session.isLoggedIn){
    let photos=await new Photo({photo:photoUrl,desc:desc,user:req.session.user});
    await photos.save();
    console.log()}
    res.redirect('/');
})



//downloading a file



router.get('/photo/:show/down',async (req,res)=>{
    const _id=req.params.show;
     const photos=await Photo.findById(_id);
    console.log(photos);
    const name=(photos.photo.toString());
    const filename=name.split('/')[1];
    const downpath=path.join('photo',filename);

    //we are reading file in chunks and send them with pipe
    const file=fs.createReadStream(downpath);

    //this is for giving extension
    res.setHeader('Content-Type','application/jpg');
    res.setHeader('Content-Disposition','inline; filename="'+filename+'"')
    //this is for giving extension
    file.pipe(res);

    // this is also right but for like video we cant use this
    //because it will collect all data then send so the other
    // thing which we can use is stream 

     // fs.readFile(downpath,(err,data)=>{
    //     if(err){
    //         return (err);
    //     }
    //     else res.send(data);
    // })

})



router.get('/photo/:show',(req,res)=>{
    let _id=mongoose.Types.ObjectId.createFromHexString(req.params.show);
    console.log(req.session.isLoggedIn)
    if(req.session.isLoggedIn){
    Photo.findById({_id},(err,photo)=>{
        if(err){
            console.log(err);
            res.send('no photo find');
        }else{
            res.render('show',{photo:photo});
        }
    })}
    else
    res.redirect('/login');
})



router.post('/photo/:delete',async(req,res)=>{
    console.log('g');
    // let _id=mongoose.Types.ObjectId.createFromHexString(req.params.show);
    let _id=req.params.delete;

    // console.log(req.session.isLoggedIn,_id,req.session.user);
    // Photo.deleteOne({_id:_id,user:req.session.user})
    await Photo.findById({_id},async(err,photo)=>{
        let photuser=photo.user;
        if(req.session.isLoggedIn){
       if(photo.user.equals(req.session.user._id)){

        //deleting a photo from our filesystem and deleting also information
        const name=(photo.photo.toString());
        const filename=name.split('/')[1];
        const downpath=path.join('photo',filename);
        deletefile(downpath)
           await Photo.findOneAndDelete({_id:_id},(err,found)=>{
               if(err){
                   console.log(err);  
                              }
                else{
                    console.log('phto found');
                }
           });
       }else{
           console.log('no match');
       }
    }})

    res.redirect('/');
})

function islogin(req,res,next){
     if(req.session.isLoggedIn){
         next();
         
     }else{
     res.redirect('/login');
    }
}


module.exports=router;