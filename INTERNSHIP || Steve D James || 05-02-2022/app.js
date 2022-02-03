require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use('/css', express.static(path.resolve(__dirname, "assets/css")))
app.use('/img', express.static(path.resolve(__dirname, "assets/img")))
app.use('/js', express.static(path.resolve(__dirname, "assets/js")))

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

var error=[];

// connecting with MongoDb
// connected with mongodb atlas

mongoose.connect("mongodb+srv://userone:userone@cluster0.uhxeb.mongodb.net/CRUD?retryWrites=true&w=majority", {useNewUrlParser: true});
mongoose.set("useCreateIndex", true);

const classssSchema = new mongoose.Schema ({
  standard: Number,
  division: String
});

const Classss = new mongoose.model("Classss", classssSchema);

const studentSchema = new mongoose.Schema({
  name : String,
  roll : String,
  mobile : Number,
  classId : String,
  standard : Number,
  division : String,
  id: String,
  classs: [{type:mongoose.Schema.Types.ObjectId, ref:'Classss'}]
});
const Student = new mongoose.model("Student", studentSchema);



app.get("/", function(req, res){  //root route
  res.redirect("/home");
  error.pop()
});

app.get("/home", function(req, res){     //home page display all students data
  Student.find({}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        // console.log(foundUsers); 
        res.render("index", {title:"All Students",data: foundUsers,error: error});
      } 
    }
  }).sort({"created":-1});
});

app.get("/add-student", function(req, res){      //add new student page
    Classss.find({},function(err,list){
      res.render("add-student",{error:error,data:list});
    });
});

app.post("/add-student", function(req, res){   //post new student data to database
  var name = req.body.name;
  var roll = req.body.roll;
  var mobile = req.body.mobile;
  var standard = req.body.standard;
  var division = req.body.division;
  // var id = req.user._id;
  Classss.findOne({standard:standard,division:division},function(err,foundList){
  if(foundList){                        //check if specified class is created
    console.log(foundList)
       // Create a new list
        const student = new Student({
          name:name,
          roll:roll,
          mobile:mobile,
          classId:foundList._id,
          standard:standard,
          division:division
        });
        console.log(student)
        student.save();
        res.redirect("/");
  }
  else{                        //if no class created, display error
    console.log("error")
    error.push("No class found!!")
    res.redirect("/add-student")
  }
  });
});

app.get("/register", function(req, res){    //register page for creating new class
  res.render("register",{isLoggedIn: req.isAuthenticated(),error: error});
  error.pop();
});

app.post("/register-class", function(req, res){    //register new class to database
  var standard= req.body.standard;
  var division= req.body.division;
  console.log(req.body.id);

  Classss.find({}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        // console.log(foundUsers); 
        console.log(foundUsers)
      } 
    }
  }).sort({"created":-1});
  Classss.findOne({standard:standard,division:division},function(err,foundList){
    if(foundList){     //if class already created, show error
      // console.log(foundList)
      error.push("class already exists!!!")
      res.redirect("/register")
    }
    else{
      var classs = new Classss({      //otherwise create new class
        standard: req.body.standard,
        division: req.body.division
      })
      
      classs.save();
      res.redirect("/")
    }

  }); 
});

app.get("/view-classes", function(req, res){    //view all registered classes
  Classss.find({}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        // console.log(foundUsers); 
        res.render("allClasses", {title:"All registered classes",data: foundUsers});
      } 
    }
  }).sort({"created":-1});
});

app.get("/view-students/:id", function(req, res){        //view students in each classs
  classId = req.params.id;
  Student.find({classId:classId}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        // console.log(foundUsers); 
        res.render("index", {data: foundUsers, title:"Students in selected class"});
      } 
    }
  }).sort({"created":-1});
});


app.get("/update-student/:id",function(req,res){      //page to update each student data
  var studentId=req.params.id;
    Student.findOne({_id:studentId},function(req,foundList){
      console.log(foundList)
      res.render("update_student",{data: foundList});

    })
});

app.get("/update-class/:id",function(req,res){     //page to update each class data
  classId=req.params.id;
    Classss.findOne({_id:classId},function(req,foundList){
      console.log(foundList)
      res.render("update_class",{data: foundList,error:error});

    })
});

app.get("/student-delete/:id",function(req,res){      //delete each student data
  studentId = req.params.id;
  console.log(studentId);
  Student.findOneAndDelete({_id: studentId}, function(err, foundList){
    if (!err){
      res.redirect("/");
    }
  });
});

app.get("/delete-class/:id",function(req,res){     //delete each class 
  classId = req.params.id;
  // console.log(studentId);
  Student.deleteMany({classId: classId}, function(err, foundList){
    if (!err){
      
    }
  });
  Classss.findOneAndDelete({_id: classId}, function(err, foundList){
    if (!err){
      console.log("success")
      res.redirect("/view-classes")
    }
  });
});

app.post("/update/:id",function(req,res){    //update student data
  studentId = req.params.id;
  var name=req.body.name;
  var roll=req.body.roll;
  var mobile=req.body.mobile;
  var standard= req.body.standard;
  var division = req.body.division;
  Classss.findOne({standard:standard,division:division},function(err,newList){
    if(newList){    //while updating class of student, student classId also get updated
      var classId = newList._id;
      Student.findOneAndUpdate({_id:studentId},{name:name,roll:roll,mobile:mobile,standard:standard,division:division, classId:classId},function(err,newList){
        res.redirect('/');
      })
    }
    else{
      error.push("No Class found!!")
    }
  })
})

app.post("/updateClass/:id",function(req,res){    //update class data
  classId = req.params.id;
  var standard= req.body.standard;
  var division = req.body.division;
  Classss.findOne({standard:standard,division:division},function(err,foundList){
    if(foundList){     //if class already exists
      error.push("Class Already Exists!!!");
      res.redirect("/update-class/"+classId)
    }
    else{       //update all student in that class to new class
      Student.updateMany({classId:classId},{standard:standard,division:division},function(err,newList){
        
      })
      Classss.findOneAndUpdate({_id:classId},{standard:standard,division:division},function(err,newList){
        res.redirect("/view-classes")
      })
    }
  })
})

app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
