const express=require('express');
const router=express.Router();
const mongoose=require("mongoose");
const {body,validationResult}=require("express-validator");
const User=require('./model/user'); 
const Photo=require('./model/photo');
// const e = require('express');
ObjectID = require("mongodb").ObjectID 

router.get('/add',(req,res)=>{
    if(req.session.isLoggedIn)
    res.render('add');
    else
    res.redirect('/login');
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

module.exports=router;