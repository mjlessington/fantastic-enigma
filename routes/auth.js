var express = require('express');
var router = express.Router();
var connection  = require('../lib/db');
 
 
//display login page
/*router.get('/', function(req, res, next){    
    // render to views/user/add.ejs
    res.render('../view/admin/login', {
        title: 'Login',
        email: '',
        password: ''     
    })
}) */
 
//display login page
/*router.get('/login', function(req, res, next){    
    // render to views/user/add.ejs
    res.render('../view/admin/login', {
        title: 'Login',
        email: '',
        password: ''    
    })
}) */
 
 
//authenticate user
router.post('/authentication', function(req, res, next) {
       
    var uname = req.body.uname;
    var pwd = req.body.pwd;
 
        connection.query('SELECT * FROM admin WHERE uname = ? AND pwd = ?', [uname, pwd], function(err, rows, fields) {
            if(err) throw err
             
            // if user not found
            if (rows.length <= 0) {
                req.flash('error', 'Please correct enter username or Password!')
                res.redirect('/admin')
            }
            else { // if user found
                // render to views/user/edit.ejs template file
                req.session.loggedin = true;
                req.session.uname = uname;
                res.redirect('/dashboard');
 
            }            
        })
  
})
 
 
//display home page

 
// Logout user
router.get('/logout', function (req, res) {
  req.session.destroy();
  //req.flash('success', 'Login Again Here');
  res.redirect('/admin');
});
 
module.exports = router;