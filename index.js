console.log("starting up!!");

const express = require('express');
const methodOverride = require('method-override');
const pg = require('pg');

//require the url library
//this comes with node, so no need to yarn add
const url = require('url');

const cookieParser = require("cookie-parser");

//check to see if we have this heroku environment variable
if( process.env.DATABASE_URL ){

  //we need to take apart the url so we can set the appropriate configs

  const params = url.parse(process.env.DATABASE_URL);
  const auth = params.auth.split(':');

  //make the configs object
  var configs = {
    user: auth[0],
    password: auth[1],
    host: params.hostname,
    port: params.port,
    database: params.pathname.split('/')[1],
    ssl: true
  };

}else{


// Initialise postgres client
var configs = {
  user: 'lty',
  host: '127.0.0.1',
  database: 'attendance',
  port: 5432,
};
}


const pool = new pg.Pool(configs);

pool.on('error', function (err) {
  console.log('idle client error', err.message, err.stack);
});

/**
 * ===================================
 * Configurations and set up
 * ===================================
 */

// Init express app
const app = express();

app.use(express.static("public"));

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.use(methodOverride('_method'));


// Set react-views to be the default view engine
const reactEngine = require('express-react-views').createEngine();
app.set('views', __dirname + '/views');
app.set('view engine', 'jsx');
app.engine('jsx', reactEngine);

app.use(cookieParser());

/**
 * ===================================
 * Routes
 * ===================================
 */

app.get("/", (request, response) => {
    response.redirect("/students");
});

app.get('/students', (request, response) => {
    // query database for students
    const queryString = "SELECT students.id, students.stud_name, students.class_name, students.presence, stud_class.class_name, stud_class.form_teacher FROM students LEFT JOIN stud_class ON students.class_name = stud_class.class_name ORDER BY students.id";
    pool.query(queryString, (err, result) => {
      if (err) {
        console.error("query error:", err.stack);
        response.send("query error");
      } else {
        //console.log("query result:", result);
        let data = {
        title: "Students",
        students: result.rows
        };
        response.render("students",data);
      }
    });
  });

//add new Student
app.get('/add-student', (req, res) => {
    let data = {
      title: "Add Student"
    };
    res.render("addStudent", data);
});

//add new student POST
app.post('/post-student', (req, res) => {
    //console.log()
    //let id = parseInt(req.body.teacher);
    const queryString =
      "INSERT INTO students (stud_name, class_name) VALUES ($1,$2)";
    let arr = [
      req.body.stud_name,
      req.body.class_name
    ];
    pool.query(queryString, arr, (err, result) => {

        if (err) {
            console.error('query error:', err.stack);
            res.send('query error');
        } else {
            res.redirect('/students');
        }
    });

});

app.get("/classes", (req, res) => {
  // query database for students
  const queryString = "SELECT * from stud_class";

  pool.query(queryString, (err, result) => {
    if (err) {
      console.error("query error:", err.stack);
      res.send("query error");
    } else {
      //console.log("query result:", result);
      let data = {
        title: "List of Classes",
        classes: result.rows
      };
      res.render("classes", data);
    }
  });
});

//add new Student
app.get("/add-class", (req, res) => {
  let data = {
    title: "Add class"
  };
  res.render("addClass", data);
});

//add new student POST
app.post("/post-class", (req, res) => {
  //console.log()
  //let id = parseInt(req.body.teacher);
  const queryString =
    "INSERT INTO stud_class (class_name, form_teacher) VALUES ($1,$2)";
  let arr = [req.body.class_name, req.body.form_teacher];
  pool.query(queryString, arr, (err, result) => {
    if (err) {
      console.error("query error:", err.stack);
      res.send("query error");
    } else {
      res.redirect("/classes");
    }
  });
});

//edit student
app.get('/students/:id/edit', (req, res) => {

    const queryString = 'SELECT * from students WHERE id=' + parseInt(req.params.id);

    pool.query(queryString, (err, result) => {

        if (err) {
            console.error('query error:', err.stack);
            res.send('query error');
        } else {
            //let cookieLogin = (sha256(req.cookies["user_id"] + 'logged_in' + SALT) === req.cookies["logged_in"]) ? true : false;
            let data = {
                title: result.rows[0].stud_name,
                students: result.rows[0]
                //cookieLogin: cookieLogin
            };
            res.render("editStudent", data);
        }
    });
});

//edit student PUT
app.put("/students/:id", (req, res) => {

      const queryString =
    "UPDATE students SET stud_name=$1, class_name=$2 WHERE id =" +
    parseInt(req.params.id) +
    "RETURNING *";
  let arr = [req.body.stud_name, req.body.class_name];


  pool.query(queryString, arr, (err, result) => {
    if (err) {
      console.error("query error:", err.stack);
      res.send("query error");
    } else {
      //let cookieLogin = (sha256(req.cookies["user_id"] + 'logged_in' + SALT) === req.cookies["logged_in"]) ? true : false;
      let data = {
        title: result.rows[0].stud_name,
        students: result.rows[0]
        //cookieLogin: cookieLogin
      };
      console.log(result);
      res.redirect("/students");
      //res.render("students", data);
      //res.render("students");
    }
  });
});

app.delete("/students/:id", (req, res) => {
  const queryString = "DELETE from students WHERE id=" + parseInt(req.params.id);
  pool.query(queryString, (err, result) => {
    if (err) {
      console.error("query error:", err.stack);
      res.send("query error");
    } else {
      res.redirect("/students");
    }
  });
});

app.put("/students/:id/present", (req, res) => {
  const queryString =
    "UPDATE students SET presence=$1 WHERE id =" +
    parseInt(req.params.id) ;
    //+ "RETURNING *";
  let arr = ['1'];
    //res.send(req.body);
  pool.query(queryString, arr, (err, result) => {
    if (err) {
      console.error("query error:", err.stack);
      res.send("query error");
      //  res.send(arr);
    } else {
      //let cookieLogin = (sha256(req.cookies["user_id"] + 'logged_in' + SALT) === req.cookies["logged_in"]) ? true : false;
    //   let data = {
    //     title: result.rows[0].stud_name,
    //     students: result.rows[0]
    //     //cookieLogin: cookieLogin
    //   };
    //   console.log(result);
      res.redirect("/students");
      //res.render("students", data);
      //res.render("students");
    }
  });
});

app.put("/students/:id/absent", (req, res) => {
  const queryString =
    "UPDATE students SET presence=$1 WHERE id =" + parseInt(req.params.id);
  //+ "RETURNING *";
  let arr = ["0"];
  //res.send(req.body);
  pool.query(queryString, arr, (err, result) => {
    if (err) {
      console.error("query error:", err.stack);
      res.send("query error");
      //  res.send(arr);
    } else {
      //let cookieLogin = (sha256(req.cookies["user_id"] + 'logged_in' + SALT) === req.cookies["logged_in"]) ? true : false;
      //   let data = {
      //     title: result.rows[0].stud_name,
      //     students: result.rows[0]
      //     //cookieLogin: cookieLogin
      //   };
      //   console.log(result);
      res.redirect("/students");
      //res.render("students", data);
      //res.render("students");
    }
  });
});

/**
 * ===================================
 * Listen to requests on port 3000
 * ===================================
 */
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () =>
  console.log("~~~ Tuning in to the waves of port " + PORT + " ~~~")
);

let onClose = function(){

  console.log("closing");

  server.close(() => {

    console.log('Process terminated');

    pool.end( () => console.log('Shut down db connection pool'));
  })
};

process.on('SIGTERM', onClose);
process.on('SIGINT', onClose);
