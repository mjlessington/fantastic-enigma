const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const port = 3003;
var flash = require('express-flash');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var authRouter = require('./routes/auth');
var db = require('./lib/db')
var fileUpload = require("express-fileupload")
var uuid = require('uuid')
const {Leopard} = require("@picovoice/leopard-node");
const accessKey = 'X9M75KOft7hk0GhzXvpjxhATqK12Vzsnur2LcCLOpZbVHmCvF4O2SQ==';
const handle = new Leopard(accessKey);


app.use(express.static("./public"))

// Set Templating Engine
//app.use(expressLayouts)
//app.set('layout', './layouts/full-width')
app.set('view engine', 'ejs')
app.set('views', [path.join(__dirname, 'views'),path.join(__dirname, 'views/admin/')]);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload());

app.use(session({ 
    secret: '123456cat',
    resave: false,
    saveUninitialized: true,
   // cookie: { maxAge: 60000 }
}))
 
app.use(flash());


var con  = require('./lib/db');

var authRouter = require('./routes/auth');
app.use('/auth', authRouter);

// Routes

//show main fornt page
app.get('', (req, res) => {
    res.render('index', {page_name: 'index'})
})

//show admin dashboard
app.get('/dashboard', function(req, res, next) {
    if (typeof req.session.uname  !== 'undefined' && req.session.uname !== null) {
        
        db.query('SELECT(SELECT COUNT(*) FROM   registration) AS Total_users,(SELECT COUNT(*)FROM  audio) AS No_Of_audio,(SELECT COUNT(*)FROM  golas) AS No_Of_golas,(SELECT COUNT(*)FROM  feedback) AS No_Of_feedback FROM dual',function(err,rows)     {
            if(err){
             req.flash('error', err); 
            }
            else
            {
                res.render('dashboard', {page_name:"dashboard",data1:rows,name: req.session.uname,});
            }
         });
         
        
 
    } else {
 
        req.flash('success', 'Please login first!');
        res.redirect('/admin');
    }
});

//show admin login page
app.get('/admin', (req, res) => {
    res.render('admin_login')
})

//show list of user in admin section
app.get('/admin_listuser', (req, res) => {
     if (typeof req.session.uname  !== 'undefined' && req.session.uname !== null) {
         
        db.query('SELECT * FROM registration ORDER BY rid desc',function(err,rows)     {
 
            if(err){
             req.flash('error', err); 
             res.render('admin_users',{page_name:"admin_users",data:'',name: req.session.uname});   
            }else{
                
                res.render('admin_users',{page_name:"admin_users",data:rows,name: req.session.uname});
            }
                            
         });
   
     }else {
 
        req.flash('success', 'Please login first!');
        res.redirect('/admin');
    }
})

//show list of category and audio list
app.get('/admin_listaudio', (req, res) => {
   // res.render('admin_audio', {page_name: 'admin_audio'})
    if (typeof req.session.uname  !== 'undefined' && req.session.uname !== null) {
         
         db.query('SELECT * FROM category ORDER BY catid desc',function(err,rows)     {
 
        if(err){
         req.flash('error', err); 
         res.render('admin_audio',{page_name:"admin_audio",data:'',name: req.session.uname});   
        }else{
            
             db.query('SELECT a.*,c.* FROM audio a LEFT JOIN category c ON a.audiocat = c.catid ORDER BY audioid desc',function(err,rows1)     {
 
                if(err){
                 req.flash('error', err); 
                 res.render('admin_audio',{page_name:"admin_audio",data1:'',data:rows,name: req.session.uname});   
                }else{
                    
                    
                    res.render('admin_audio',{page_name:"admin_audio",data1:rows1,data:rows,name: req.session.uname});
                }
                                    
                 });
            }
                            
         });
         
       
    } else {
 
        req.flash('success', 'Please login first!');
        res.redirect('/admin');
    }
})

//add new category
app.post('/add_cat', function (req, res, next) {
    if (typeof req.session.uname  !== 'undefined' && req.session.uname !== null) {
  var cat_name = req.body.cat_name
  
  var sql = `INSERT INTO category (catname) VALUES ("${cat_name}")`
  db.query(sql, function (err, result) {
    if (err) throw err
   // console.log('Row has been updated')
    req.flash('addcat', 'Your Category Added Successfully!')
    //res.render('admin_listcat', {page_name: 'admin_cat'})
    res.redirect('/admin_listcat');
  })
    }
})


//cat delete
app.get('/deletecat/:id', function(req, res, next) {
    if (typeof req.session.uname  !== 'undefined' && req.session.uname !== null) {
  var id= req.params.id;
    var sql = 'DELETE FROM category WHERE catid = ?';
    db.query(sql, [id], function (err, data) {
    if (err) throw err;
    var sql1 = 'DELETE FROM audio WHERE audiocat = ?';
        db.query(sql1, [id], function (err, data1) {
        if (err) throw err;
        
        //console.log(data.affectedRows + " record(s) updated");
      });
    //console.log(data.affectedRows + " record(s) updated");
  });
  req.flash('delcat', 'Your Category Deleted Successfully!')
  res.redirect('/admin_listcat');
    }
});

app.post('/getText', (req, res) => {
  const { audioCurTime, audiowords } = req.body;
  var textWordsArr = JSON.parse(audiowords)
   //console.log('textWordsArr::',textWordsArr);
  var wordVal = '';

  var words = [];
  if (textWordsArr.length > 0) {

    for (var x = 0; x < textWordsArr.length; x++) {
      arr = {};
      //console.log(audioCurTime+'---'+textWordsArr[x].startSec)
      if(audioCurTime >= textWordsArr[x].startSec){
        arr['word'] = textWordsArr[x].word;
        words.push(arr);
      }
    }
  }
   //console.log('audioCurTime::***********',audioCurTime);
  // console.log('words::',words);
  return res.status(200).json({
    status: 1,
    message: 'Success',
    data:{words:words}
  });
});

app.post('/add_audio', function (req, res, next) {
if (typeof req.session.uname  !== 'undefined' && req.session.uname !== null) {    
  var taudio = req.body.taudio
  var iaudion =''
  var uaudion =''
  var caudio = req.body.caudio
  var gaudio = req.body.gaudio
  var paudio = req.body.paudio
  var puaudio = req.body.puaudio
  var duration = req.body.f_du
  
  if (req.files){
      var file = req.files.iaudio
      var imageName = file.name
      if(imageName!=''){
       var uuidname = uuid.v1();
        var imgsrc = 'https://doseofmotivation.jdinfotech.net/assets/audio_images/' + uuidname + file.name
        file.mv(path.join(__dirname, '/assets/audio_images/') + uuidname + file.name)
        iaudion = uuidname + file.name
        //console.log(iaudion)
      }
      
      var file1 = req.files.uaudio
      var imageName1 = file1.name
       
      if(imageName1!=''){
       var uuidname1 = uuid.v1();
        var imgsrc1 = 'https://doseofmotivation.jdinfotech.net/assets/audio_files/' + uuidname1 + file1.name
        file1.mv(path.join(__dirname, '/assets/audio_files/') + uuidname1 + file1.name)
        uaudion = uuidname1 + file1.name
       // console.log(uaudion)
      } 
  }
  //res.redirect('/admin_listaudio');
  
  var sql = `INSERT INTO audio (audiotitle,audioimg,audiofile,audiocat,audiogender,audiopre,audiopublish,uploaddate,duration,audiotxt,audiowords) VALUES ("${taudio}","${iaudion}","${uaudion}","${caudio}","${gaudio}","${paudio}","${puaudio}",NOW(),"${duration}",'','')`
  db.query(sql, function (err, result) {
    if (err) throw err
   // console.log('Row has been updated')
   req.flash('addaudio', 'Your Audio Added Successfully!')
    //res.render('admin_listcat', {page_name: 'admin_cat'})
    audio_text(result.insertId)
    res.redirect('/admin_listaudio');
  }) 
}
})

//display data in edit page of audio

app.get('/editaudio/:id', function(req, res, next) {
    
    var aid= req.params.id;   
    
     db.query('SELECT * from audio WHERE audioid = ? ', [aid], function(err, rows, fields) {
 
        return res.status(200).json({
                        status: 1,
                        data: rows
                    });
       
        })  
    
})    


app.post('/update_audio', function (req, res, next) {
if (typeof req.session.uname  !== 'undefined' && req.session.uname !== null) {    
  var etaudio = req.body.etaudio
  var eiaudio =''
  var uaudion =''
  var ecaudio = req.body.ecaudio
  var egaudio = req.body.egaudio
  var epre = req.body.epre
  var epaudio = req.body.epaudio
  var uploaddate = new Date().toISOString().substring(0,19).replace("T"," ");  
  var eaid = req.body.eaid 
  
  if (req.files){
      var file = req.files.eiaudio
      if(typeof file!=='undefined'){
      var imageName = file.name
      if(imageName!=''){
      var uuidname = uuid.v1();
        var imgsrc = 'https://doseofmotivation.jdinfotech.net/assets/audio_images/' + uuidname + file.name
        file.mv(path.join(__dirname, '/assets/audio_images/') + uuidname + file.name)
        iaudion = uuidname + file.name
        //console.log(iaudion)
        db.query('update audio set audiotitle = ?, audioimg = ?, audiocat = ?, audiogender = ?, audiopre = ?, audiopublish = ?, uploaddate = ?  WHERE audioid = ? ', [etaudio,iaudion,ecaudio,egaudio,epre,epaudio,uploaddate,eaid], function(err, rows, fields) {
            if(err){
             req.flash('editaudio', 'Your Audio Not Updated Successfully!')
             res.redirect('/admin_listaudio'); 
            }else{
            req.flash('editaudio', 'Your Audio Updated Successfully!')
            res.redirect('/admin_listaudio');    
            }
        })
      }
      }
      
      var file1 = req.files.euaudio
      if(typeof file1!=='undefined'){
      var imageName1 = file1.name
      if(imageName1!=''){
      var uuidname1 = uuid.v1();
        var imgsrc1 = 'https://doseofmotivation.jdinfotech.net/assets/audio_files/' + uuidname1 + file1.name
        file1.mv(path.join(__dirname, '/assets/audio_files/') + uuidname1 + file1.name)
        uaudion = uuidname1 + file1.name
        db.query('update audio set audiotitle = ?, audiofile = ?, audiocat = ?, audiogender = ?, audiopre = ?, audiopublish = ?, uploaddate = ?  WHERE audioid = ? ', [etaudio,uaudion,ecaudio,egaudio,epre,epaudio,uploaddate,eaid], function(err, rows, fields, result) {
            if(err){
             req.flash('editaudio', 'Your Audio Not Updated Successfully!')
             res.redirect('/admin_listaudio'); 
            }else{
            req.flash('editaudio', 'Your Audio Updated Successfully!')
            audio_text(eaid)
            res.redirect('/admin_listaudio');    
            }
        })
      // console.log(uaudion)
      } 
      }
  }
  //res.redirect('/admin_listaudio');
  
else {
 db.query('update audio set audiotitle = ?, audiocat = ?, audiogender = ?, audiopre = ?, audiopublish = ?, uploaddate = ?  WHERE audioid = ? ', [etaudio,ecaudio,egaudio,epre,epaudio,uploaddate,eaid], function(err, rows, fields) {
        if(err){
         req.flash('editaudio', 'Your Audio Not Updated Successfully!')
         res.redirect('/admin_listaudio'); 
        }else{
        req.flash('editaudio', 'Your Audio Updated Successfully!')
        res.redirect('/admin_listaudio');    
        }
    })
   }
}
})


//audio delete
app.get('/deleteaudio/:id', function(req, res, next) {
    if (typeof req.session.uname  !== 'undefined' && req.session.uname !== null) {
  var id= req.params.id;
    var sql = 'DELETE FROM audio WHERE audioid = ?';
    db.query(sql, [id], function (err, data) {
    if (err) throw err;
    //console.log(data.affectedRows + " record(s) updated");
  });
  
   var sql1 = 'DELETE FROM favorites WHERE aid = ?';
    db.query(sql1, [id], function (err, data1) {
    if (err) throw err;
    //console.log(data.affectedRows + " record(s) updated");
  });
  req.flash('delaudio', 'Your Audio Deleted Successfully!')
  res.redirect('/admin_listaudio');
    }
});

//registration 
app.post('/registration', function (req, res, next) {
    
  if(req.body.pwd == req.body.cpwd){
  var uname = req.body.uname
  var uemail = req.body.uemail
  var gender = req.body.gender
  var work = req.body.work
  var promise = req.body.promise
  var prefer = req.body.prefer
  var pwd = req.body.pwd
  
      var sql = `INSERT INTO registration (uname,uemail,gender,work,promise,prefer,pwd,status,rdate) VALUES ("${uname}","${uemail}","${gender}","${work}","${promise}","${prefer}","${pwd}","Publish",NOW())`
      db.query(sql, function (err, result) {
        if (err) throw err
       // console.log('Row has been updated')
       req.flash('useregi', 'User Registration Successfully!')
        //res.render('admin_listcat', {page_name: 'admin_cat'})
        res.redirect('/signup');
      }) 
  }
  else{
        req.flash('useregie', 'Confirm Password & Password not Match')
        //res.render('admin_listcat', {page_name: 'admin_cat'})
        res.redirect('/signup'); 
  }
  
});  

//user login
app.post('/loginchk', function(req, res, next) {
       
    var uemail = req.body.uemail;
    var upwd = req.body.upwd;
    
     db.query('SELECT * FROM registration WHERE uemail = ? AND pwd = ?', [uemail, upwd], function(err, rows, fields) {
        if(err) throw err
         
        // if user not found
        if (rows.length <= 0) {
            req.flash('ulogine', 'Please enter correct username or Password!')
            res.redirect('/')
        }
        else { // if user found
            // render to views/user/edit.ejs template file
            req.session.loggedin = true;
            req.session.uid = rows[0].rid;
            res.redirect('/home');
    
        }   
     }) 
 
});

//show admin feedback
app.get('/admin_feedback', (req, res) => {
     if (typeof req.session.uname  !== 'undefined' && req.session.uname !== null) {
        
         db.query('SELECT u.*,r.uname,r.uemail FROM feedback u LEFT JOIN registration r ON u.uid = r.rid ORDER BY fid desc',function(err,rows)     {
 
        if(err){
         req.flash('error', err); 
         res.render('admin_feedback',{page_name:"admin_feedback",data:'',name: req.session.uname});   
        }else{
            
            res.render('admin_feedback',{page_name:"admin_feedback",data:rows,name: req.session.uname});
        }
       
         })
     }
})

//user side list of audio on home page
app.get('/home', (req, res) => {

 if (typeof req.session.uid !== 'undefined' && req.session.uid !== null) {
        var pub = 'Yes'
         db.query('SELECT a.*,c.* FROM audio a LEFT JOIN category c ON a.audiocat = c.catid where audiopublish= ? ORDER BY audioid desc',[pub],function(err,rows)     {
 
        if(err){
         req.flash('error', err); 
         res.render('home',{page_name:"homepg",data:'',name: req.session.uid});   
        }else{
            var uid = req.session.uid
           db.query('SELECT * from golas where uid= ? GROUP BY group_id ORDER BY gid desc',[uid],function(err,rows1)     {
 
            if(err){
              req.flash('error', err); 
              res.render('home',{page_name:"homepg",data:rows,name: req.session.uname}); 
            }else{
                
                if(rows1.length <= 0) {
                    
                     db.query('SELECT f.aid,f.uid,a.audioid FROM favorites f LEFT JOIN audio a ON f.aid = a.audioid where uid = ?',[req.session.uid],function(err,rows3)     {
 
                    if(err){
                     req.flash('error', err); 
                     res.render('home',{page_name:"homepg",data:rows,data2:'',data3:'',name: req.session.uname}); 
                    }else{
                        
                        res.render('home',{page_name:"homepg",data:rows,data2:'',data3:rows3,name: req.session.uname}); 
                    }
                   
                     })
                    
                //res.render('home',{page_name:"homepg",data:rows,data2:'',name: req.session.uid});
                }
                else{
                   
                     db.query('SELECT * from golas where uid= ? and group_id = ? ORDER BY gid desc',[uid,rows1[0].group_id],function(err,rows2)     {
 
                if(err){
                 req.flash('error', err); 
                 
                  db.query('SELECT f.aid,f.uid,a.audioid FROM favorites f LEFT JOIN audio a ON f.aid = a.audioid where uid = ?',[req.session.uid],function(err,rows3)     {
 
                    if(err){
                     req.flash('error', err); 
                     res.render('home',{page_name:"homepg",data:rows,data2:rows2,data3:'',name: req.session.uname}); 
                    }else{
                        
                        res.render('home',{page_name:"homepg",data:rows,data2:rows2,data3:rows3,name: req.session.uname}); 
                    }
                   
                     })
                 
                 
                }else{
                     db.query('SELECT f.aid,f.uid,a.audioid FROM favorites f LEFT JOIN audio a ON f.aid = a.audioid where uid = ?',[req.session.uid],function(err,rows3)     {
 
                    if(err){
                     req.flash('error', err); 
                     res.render('home',{page_name:"homepg",data:rows,data2:rows2,data3:'',name: req.session.uname}); 
                    }else{
                        
                        res.render('home',{page_name:"homepg",data:rows,data2:rows2,data3:rows3,name: req.session.uid});
                    }
                   
                     })
                    
                }
               
                 })
                }
               // res.render('home',{page_name:"homepg",data:rows,data1:rows1,name: req.session.uid});
            }
           
             })
            //res.render('home',{page_name:"homepg",data:rows,name: req.session.uid});
        }
       
         })
    }
    else{
    res.redirect('/'); 
    }
    
})

//show audio paly page
app.get('/audioplay/:audid', (req, res) => {
    if (typeof req.session.uid !== 'undefined' && req.session.uid !== null) {
         var audid= req.params.audid;     
    
     db.query('SELECT a.*,c.* FROM audio a LEFT JOIN category c ON a.audiocat = c.catid WHERE audioid = ? ', [audid], function(err, rows, fields) {
 
        if(err){
         req.flash('error', err); 
         res.render('audioplay',{page_name:"homepg",data:'',name: req.session.uid});   
        }else{
            
            var uid = req.session.uid
           db.query('SELECT * from golas where uid= ? GROUP BY group_id ORDER BY gid desc',[uid],function(err,rows1)     {
 
            if(err){
              req.flash('error', err); 
              res.render('audioplay',{page_name:"homepg",data:rows,name: req.session.uname}); 
            }else{
                
                if(rows1.length <= 0) {
                res.render('audioplay',{page_name:"homepg",data:rows,data2:'',name: req.session.uid});
                }
                else{
                   
                     db.query('SELECT * from golas where uid= ? and group_id = ? ORDER BY gid desc',[uid,rows1[0].group_id],function(err,rows2)     {
 
                if(err){
                 req.flash('error', err); 
                 res.render('audioplay',{page_name:"homepg",data:rows,name: req.session.uname}); 
                }else{
                    
                    res.render('audioplay',{page_name:"homepg",data:rows,data2:rows2,name: req.session.uid});
                }
               
                 })
                }
               // res.render('home',{page_name:"homepg",data:rows,data1:rows1,name: req.session.uid});
            }
           
             })
            
            //res.render('audioplay',{page_name:"homepg",data:rows,name: req.session.uid});
        }
       
         })
    }
    else{
    res.redirect('/'); 
    }
})

//show user add gola page
app.get('/addgoal', (req, res) => {
     if (typeof req.session.uid !== 'undefined' && req.session.uid !== null) {
        res.render('addgoals', {page_name: 'addgoals'})
     }
    else{
        res.redirect('/'); 
    }
})

//add user goals
app.post('/usgoaladd', function (req, res, next) {
    if (typeof req.session.uid  !== 'undefined' && req.session.uid !== null) {
  
  var goals = req.body.goals
  var uid = req.session.uid
  const date = new Date();

    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    let currentDate = `${day}-${month}-${year}`;
    var groupid;
  
     db.query('SELECT group_id from golas ORDER BY gid desc',function(err,rows)     {
 
        if(err) throw err
         
        
        if (rows.length <= 0) {
            groupid = 1;
        }
        else { // if user found
            groupid = parseInt(rows[0].group_id) + 1;
        }   
        
       
       for(var j=0;j<goals.length;j++){
           
           var sql = `INSERT INTO golas (uid,golas,group_id,gdate) VALUES ("${uid}","${goals[j]}","${groupid}","${currentDate}")`
           db.query(sql, function (err, result) {
            if (err) throw err
          })
           
       }
       // console.log('Row has been updated')
            req.flash('addgola', 'Your Gola Added Successfully!')
            //res.render('admin_listcat', {page_name: 'admin_cat'})
            res.redirect('/listgoal');
        
        
     })    
      
  
  
    }
})

app.get('/favorite', (req, res) => {
    
    if (typeof req.session.uid  !== 'undefined' && req.session.uid !== null) {
    
     db.query('SELECT f.*,a.* FROM favorites f LEFT JOIN audio a ON f.aid = a.audioid where uid = ?',[req.session.uid],function(err,rows)     {
 
        if(err){
         req.flash('error', err); 
         res.render('favorite',{page_name:"favorite",data:'',name: req.session.uname}); 
        }else{
            
            res.render('favorite',{page_name:"favorite",data:rows,name: req.session.uid});
        }
       
         })
 
     } else{
    res.redirect('/'); 
    }
})

app.get('/favadd/:favid', (req, res) => {
     if (typeof req.session.uid  !== 'undefined' && req.session.uid !== null) {
    var favid= req.params.favid;
     var sql = `INSERT INTO favorites (uid,aid) VALUES ("${req.session.uid}","${favid}")`
      db.query(sql, function (err, result) {
        if (err) throw err
       // console.log('Row has been updated')
       req.flash('useregi', 'User Registration Successfully!')
        //res.render('admin_listcat', {page_name: 'admin_cat'})
        res.redirect('/favorite');
      }) 
     } else{
    res.redirect('/'); 
    }
    
})

app.get('/favremo/:favid', (req, res) => {
     if (typeof req.session.uid  !== 'undefined' && req.session.uid !== null) {
    var favid= req.params.favid;
     var sql = `Delete from favorites where uid = ? AND aid = ?`
      db.query(sql,[req.session.uid,favid] ,function (err, result) {
        if (err) throw err
       // console.log('Row has been updated')
       req.flash('useregi', 'User Registration Successfully!')
        //res.render('admin_listcat', {page_name: 'admin_cat'})
        res.redirect('/favorite');
      }) 
     } else{
    res.redirect('/'); 
    }
    
})


//userside list of goals
app.get('/listgoal', (req, res) => {
    if (typeof req.session.uid !== 'undefined' && req.session.uid !== null) {
        
        var uid = req.session.uid;
     db.query('SELECT *,COUNT(*) as noofgoals FROM golas WHERE uid = ? GROUP BY group_id ORDER BY gid DESC', [uid], function(err, rows, fields) {
 
        if(err){
         req.flash('error', err); 
         res.render('listgoal',{page_name:"listgoal",data:'',name: req.session.uid});   
        }else{
            
            res.render('listgoal',{page_name:"listgoal",data:rows,name: req.session.uid});
        }
       
         })
    }     
    else{
    res.redirect('/'); 
    }
})

//user side show details goals
app.get('/viewgoal/:gid', (req, res) => {
     if (typeof req.session.uid !== 'undefined' && req.session.uid !== null) {
     var gid= req.params.gid;     
    
     db.query('SELECT gid,golas FROM golas WHERE group_id = ? ', [gid], function(err, rows, fields) {
 
        if(err){
         req.flash('error', err); 
         res.render('viewgoal',{page_name:"viewgoal",data:'',name: req.session.uid});   
        }else{
            
            res.render('viewgoal',{page_name:"viewgoal",data:rows,name: req.session.uid});
        }
       
         })
         
     }
})

//user side edit goals page show
app.get('/editgoal/:gid', (req, res) => {
     if (typeof req.session.uid !== 'undefined' && req.session.uid !== null) {
     var geid= req.params.gid;     
    
     db.query('SELECT * FROM golas WHERE gid = ? ', [geid], function(err, rows, fields) {
 
        if(err){
         req.flash('error', err); 
         res.render('editgoal',{page_name:"editgoal",data:'',name: req.session.uid});   
        }else{
            
            res.render('editgoal',{page_name:"editgoal",data:rows,name: req.session.uid});
        }
       
         })
         
     }
})


//user side update goals
app.post('/updgola/:gid', (req, res) => {
     if (typeof req.session.uid !== 'undefined' && req.session.uid !== null) {
     var geid= req.params.gid;     
     var edigo = req.body.egoals
    
     db.query('update golas set golas = ?  WHERE gid = ? ', [edigo,geid], function(err, rows, fields) {
 
        if(err){
         req.flash('editgoale', 'Your Category Deleted Successfully!')
         res.redirect('/editgoal/'+geid); 
        }else{
        req.flash('editgoals', 'Your Gola Update Successfully!')
        res.redirect('/editgoal/'+geid);    
        }
       
         })
         
     }
})

//user side delete goal
app.get('/delgoal/:dgid', function(req, res, next) {
    if (typeof req.session.uid  !== 'undefined' && req.session.uid !== null) {
  var dgid= req.params.dgid;
    var sql = 'DELETE FROM golas WHERE gid = ?';
    db.query(sql, [dgid], function (err, data) {
    if (err) throw err;
    //console.log(data.affectedRows + " record(s) updated");
  });
  req.flash('delgoal', 'Your Goal Deleted Successfully!')
  res.redirect('/listgoal');
    }
});

//show user feedback page
app.get('/feedback', (req, res) => {
     if (typeof req.session.uid !== 'undefined' && req.session.uid !== null) {
            res.render('feedback', {page_name: 'feedback'})
     }
     else{
            res.redirect('/'); 
    }
})

//add user feedback
app.post('/userfeed', (req, res) => {
     if (typeof req.session.uid !== 'undefined' && req.session.uid !== null) {
         
          var uid = req.session.uid
          var feedback = req.body.ufeedback
         
          var sql = `INSERT INTO feedback (uid,feedback,feeddate) VALUES ("${uid}","${feedback}",NOW())`
          db.query(sql, function (err, result) {
                if (err) throw err
               // console.log('Row has been updated')
               req.flash('usefeed', 'Your Feedback Submited Successfully!')
                //res.render('admin_listcat', {page_name: 'admin_cat'})
                res.redirect('/feedback');
              }) 
            
     }
     else{
            res.redirect('/'); 
    }
})

app.get('/signup', (req, res) => {
    res.render('signup', {page_name: 'signup'})
})

//user logout
app.get('/ulogout', function (req, res) {
  req.session.destroy();
  //req.flash('success', 'Login Again Here');
  res.redirect('/');
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})