const mysql = require('mysql')
const con = mysql.createConnection({
  host: "localhost",
  user: "doseofmotivation_musicaluser",
  password: "f!kz9GAT;H3{",
  database : 'doseofmotivation_musicalapp'
});

con.connect(function(error){
   if(!!error){
     console.log(error);
   }else{
     console.log('Connected!:)');
   }
 });  
module.exports = con; 
