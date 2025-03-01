const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const cors = require('cors');
const app = express();
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "http://127.0.0.1:5501",  // Allow frontend to access backend
    credentials: true  // Allow cookies & sessions
}));

// Set up session management
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    clearExpired: true, // Auto clear expired sessions
    expiration: process.env.SESSION_EXPIRATION // 5 days session validity
});


// Set up session management with MySQL store
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        httpOnly: true,  
        secure: false,   
        maxAge: parseInt(process.env.SESSION_EXPIRATION) // 5 days session validity
    }
}));


const port = 3000;

// Establish MySQL connection
const connection = mysql.createConnection({
    host: "bglcmw16wlszwmrecqnj-mysql.services.clever-cloud.com",
    user: "uzlbfyudnbulgghr",
    password: "zIXdXKh8izreff5kcU2z",
    database: "bglcmw16wlszwmrecqnj",
    port: 3306,
});

connection.connect((err) => {
    if (err) {
        console.log("Connection with MySQL failed", err);
    } else {
        console.log("Connection established successfully");
    }
});

// Middleware to prevent caching
app.use((req, res, next) => {
    console.log("Cache control middleware");
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '-1');
    next();
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    console.log("Checking authentication");
    console.log("Session data:", req.session);
    if (req.session.userId) {
        console.log("User is authenticated");
        next();
    } else {
        console.log("User is not authenticated");
        res.redirect('/login.html');
    }
};

// Apply session and authentication middleware
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});

// Route to serve the registration page
app.get('/register_user', (req, res) => {
    console.log("Serving register_user page");
    res.sendFile(path.join(__dirname, '..', 'register.html'));
});

// Route to handle user registration
app.post('/register_user', async (req, res) => {
    console.log("Handling user registration");
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users(username, password, email) VALUES (?,?,?)';
    connection.query(sql, [username, hashedPassword, email], (err, results) => {
        if (err) throw err;
        console.log("Registration successful");
        req.session.userId = results.insertId;  // Store user ID in session
        req.session.username = username;
        req.session.email = email;

        console.log("Session stored:", req.session);

        res.redirect('/home.html');
    });
});

app.get("/", (req, res) => {
    console.log("Serving home page");
    res.sendFile(path.join(__dirname, "..", "homepage.html"));
});
// Route to serve the login page
app.get('/login_user', (req, res) => {
    console.log("Serving login_user page");
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});
app.get('/homepage.html', (req, res) => {
    console.log("Serving home page");
    res.sendFile(path.join(__dirname, '..', 'homepage.html'));
});

// Route to handle user login
app.post('/login_user', (req, res) => {
    console.log("Handling user login");

    // If session exists, redirect to home
    if (req.session.userId) {
        console.log("User already logged in, redirecting to home.");
        return res.redirect('/home.html');
    }

    const { username, password } = req.body;
    connection.query('SELECT user_id, password FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Internal Server Error");
        }
        if (results.length > 0) {
            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                req.session.userId = user.user_id;
                req.session.username = username;
                await req.session.save(); // Explicitly save session
                
                console.log("Login successful", "Session ID:", req.sessionID);
                res.redirect('/home.html');
            } else {
                console.log("Invalid credentials - password mismatch");
                res.send("Invalid Credentials");
            }
        } else {
            console.log("Invalid credentials - username not found");
            res.send("Invalid Credentials");
        }
    });
});
// checks user is authenticated
app.get('/auth/check-session', (req, res) => {
    if (req.session && req.session.userId) {
        console.log("Session exists for user:", req.session.username);
        res.json({ authenticated: true });
    } else {
        console.log("No active session found.");
        res.json({ authenticated: false });
    }
});

// Route to handle logout
app.get('/logout', (req, res) => {
    console.log("Handling user logout");
    req.session.destroy((err) => {
        if (err) {
            console.log("Error logging out");
            return res.send("Error logging out");
        }
        res.clearCookie('connect.sid'); // Clear the cookie
        console.log("User logged out session destroyed");
        res.redirect('/homepage.html');
    });
});

// Apply authentication middleware to protected routes
app.use('/home.html', isAuthenticated);
app.use('/income.html', isAuthenticated);
app.use('/expenses.html', isAuthenticated);
app.use('/budget.html',isAuthenticated)
app.use('/reports.html',isAuthenticated)
app.use('/charts.html',isAuthenticated)
app.use('/feedback.html',isAuthenticated)
// Serve static files
app.use(express.static(path.join(__dirname, '..')));
// Protected route for home page
app.get('/home.html', (req, res) => {
    console.log("Serving home page");
    res.sendFile(path.join(__dirname, '..', 'home.html'));
});

// Protected route to serve add_income page
app.get('/add_income', (req, res) => {
    console.log("Serving add_income page");
    res.sendFile(path.join(__dirname, '..', 'income.html'));
});
//Route to serve income page
app.post('/add_income',(req,res)=>{
    console.log("Handling users income data")
    const{expenses_category,amount,note,month,year}=req.body
    const userId=req.session.userId
    console.log(`User id is ${userId}`)
    const sql='insert into income(user_id,amount,source,description,month,year) values (?,?,?,?,?,?)'
    connection.query(sql,[userId,amount,expenses_category,note,month,year],(err,results)=>{
        if(err) throw err
        console.log("Data in income table added successfully")
        res.redirect('/home.html')
    })
})
// route to fetch user's income
app.get('/fetch_income',(req,res)=>{
    const userId=req.session.userId;
    const month=req.query.month
    const year=req.query.year
    if(!month||!year){
        res.status(400).send("Month and year are required");
        return;
    }
    const sql='SELECT id,amount,source,description,DATE_FORMAT(date,"%Y-%m-%d %H:%i:%S") AS date FROM income WHERE user_id=? and month=? and year=? ORDER BY date DESC'
    connection.query(sql,[userId,month,year],(err,results)=>{
        if (err) {
            console.error("Error fetching income data", err);
            res.status(500).send("Server error");
            return;
        }
        console.log("Income data fetched successfully")
        res.json(results)
    })
})
//Protected route for expenses page
app.get('/add_expenses',(req,res)=>{
    res.sendFile(path.join(__dirname,'..','expenses.html'))
})
//Route to serve expense page
app.post('/add_expenses',(req,res)=>{
    const{expenses_category,amount,note,month,year}=req.body
    const userId=req.session.userId
    const sql='insert into expenses(user_id,amount,category,description,month,year) values (?,?,?,?,?,?)'
    connection.query(sql,[userId,amount,expenses_category,note,month,year],(err,results)=>{
        if(err) throw err
        console.log("Expenses data added successfully")
        res.redirect('/home.html')
    })
})
//route to fetch expense data
app.get('/fetch_expenses',(req,res)=>{
    const userId=req.session.userId
    const month=req.query.month
    const year=req.query.year
    if(!month||!year){
        res.status(400).send('Month and year are required')
    }
    const sql='SELECT id,amount,category,description,DATE_FORMAT(date,"%Y-%m-%d %H:%i:%S") AS date FROM expenses WHERE user_id=? and month=? and year=? ORDER BY date DESC'
    connection.query(sql,[userId,month,year],(err,results)=>{
        if (err) {
            console.error("Error fetching income data", err);
            res.status(500).send("Server error");
            return;
        }
        console.log("Expenses data fetched successfully")
        res.json(results)
    })
})
//Deletion of income data
app.delete('/delete_income/:id',(req,res)=>{
    const recordid=req.params.id;
    const userId=req.session.userId
    const sql='DELETE FROM income WHERE user_id=? AND id=?'
    connection.query(sql,[userId,recordid],(err,results)=>{
        if(err){
            console.log("Error in deletion of income",err)
            res.status(500).send("Server Error")
            return
        }
        if(results.effectedRows==0){
            console.log("No such data found")
            res.status(404).send("Record not found")
            return
        }
        else{
            console.log("Income data deleted successfully")
            res.status(200).send("Income record deleted successfully")
        }
    })
})
// Start the server
app.delete('/delete_expenses/:id',(req,res)=>{
    const recordId=req.params.id
    const userId=req.session.userId
    const sql='DELETE FROM expenses WHERE user_id=? AND id=?'
    connection.query(sql,[userId,recordId],(err,results)=>{
        if(err){
            res.status(500).send("Server error")
            console.log("Error in deletion of expenses data")
            return
        }
        if(results.effectedRows==0){
            console.log("Records not found")
            return
        }
        else{
            console.log("Expenses data deleted successfully")
            res.status(200).send("Income record deleted successfully")
        }
    })
})
app.get('/update_income',(req,res)=>{
    res.sendFile(path.join(__dirname,'..','home.html'))
})
app.post('/update_income',(req,res)=>{
    const{id,attribute,update_value}=req.body
    const userId=req.session.userId
    let sql
    switch(attribute){
        case 'amount':
            sql='UPDATE income SET amount=? WHERE user_id=? AND id=?'
            break
        case 'source':
            sql='UPDATE income SET source=? WHERE user_id=? AND id=?'
            break
        case 'note':
            sql='UPDATE income SET description=? WHERE user_id=? AND id=?'
            break
        default:
            return res.status(400).send("invalid attribute")
    }
    connection.query(sql,[update_value,userId,id],(err,results)=>{
        if(err){
            console.error("Error updating income data")
            return res.status(500).send("Server error")
        }
        if(results.effectedRows==0){
            return res.status(404).send("Record not found")
        }
        console.log("Income data updated Successfully")
        res.redirect('/home.html')
    })
})
app.get('/update_expenses',(req,res)=>{
    res.sendFile(path.join(__dirname,'..','home.html'))
})
app.post('/update_expenses',(req,res)=>{
    const{id1,attribute,update_value}=req.body
    const userId=req.session.userId
    let sql
    switch(attribute){
        case 'amount':
            sql='UPDATE expenses SET amount=? WHERE user_id=? AND id=?'
            break
        case 'source':
            sql='UPDATE expenses SET category=? WHERE user_id=? AND id=?'
            break
        case 'note':
            sql='UPDATE expenses SET description=? WHERE user_id=? AND id=?'
            break
        default:
            return res.status(400).send("invalid attribute")
    }
    connection.query(sql,[update_value,userId,id1],(err,results)=>{
        if(err){
            console.error("Error updating expenses data")
            return res.status(500).send("Server error")
        }
        if(results.effectedRows==0){
            return res.status(404).send("Record not found")
        }
        console.log("Expenses data updated Successfully")
        res.redirect('/home.html')
    })
})
app.get('/add_budget',(req,res)=>{
    res.sendFile(path.join(__dirname,'..','budget.html'))
})
app.post('/add_budget',(req,res)=>{
    const{expenses_category,amount,month,year}=req.body
    const userId=req.session.userId
    const sql='insert into budgets(user_id,category,amount,month,year) values (?,?,?,?,?)'
    connection.query(sql,[userId,expenses_category,amount,month,year],(err,results)=>{
        if(err) throw err
        console.log("Budget data added successfully")
        res.redirect('/home.html')
    })
})
app.get('/fetch_budget',(req,res)=>{
    const userId=req.session.userId
    const month=req.query.month
    const year=req.query.year
    if(!month||!year){
        res.status(400).send('Month and year are requires')
    }
    const sql='SELECT id,amount,category,DATE_FORMAT(date,"%Y-%m-%d %H:%i:%S") AS date FROM budgets WHERE user_id=? and month=? and year=? ORDER BY date DESC'
    connection.query(sql,[userId,month,year],(err,results)=>{
        if(err){
            console.error("Error fetching budgets data", err);
            res.status(500).send("Server error");
            return;
        }
        else{
            console.log("Budgets data fetched successfully")
            res.json(results)
        }
    })
})
app.get('/fetch_monthlybudget',(req,res)=>{
    const userId=req.session.userId
    const month=req.query.month
    const year=req.query.year
    const sql = 'SELECT id, amount, DATE_FORMAT(date, "%Y-%m-%d %H:%i:%S") AS date FROM budgets WHERE user_id=? AND category=\'Monthly-Budget\' AND month=? AND year=? ORDER BY date DESC';
    connection.query(sql,[userId,month,year],(err,results)=>{
        if(err){
            console.error("Error fetching budgets data", err);
            res.status(500).send("Server error");
            return;
        }
        else{
            console.log("MonthlyBudget data fetched successfully")
            res.json(results)
        }
    })
})
app.delete('/delete_budget/:id',(req,res)=>{
    const recordId=req.params.id
    const userId=req.session.userId
    const sql='DELETE FROM budgets WHERE user_id=? AND id=?'
    connection.query(sql,[userId,recordId],(err,results)=>{
        if(err){
            res.status(500).send("Server error")
            console.log("Error in deletion of budget data")
            return
        }
        if(results.effectedRows==0){
            console.log("Records not found")
            return
        }
        else{
            console.log("budget data deleted successfully")
            res.status(200).send("Income record deleted successfully")
        }
    })
})
app.post('/update_budget',(req,res)=>{
    const{id2,attribute,update_value}=req.body
    const userId=req.session.userId
    let sql
    switch(attribute){
        case 'amount':
            sql='UPDATE budgets SET amount=? WHERE user_id=? AND id=?'
            break
        case 'source':
            sql='UPDATE budgets SET category=? WHERE user_id=? AND id=?'
            break
        default:
            return res.status(400).send("invalid attribute")
    }
    connection.query(sql,[update_value,userId,id2],(err,results)=>{
        if(err){
            console.error("Error updating budget data")
            console.log(err)
            return res.status(500).send("Server error")
        }
        if(results.effectedRows==0){
            return res.status(404).send("Record not found")
        }
        console.log("budget data updated Successfully")
        res.redirect('/home.html')
    })
})
app.get('/fetch_yearincome',(req,res)=>{
    const userId=req.session.userId
    const year=req.query.year
    if(!year){
        res.status(400).send("Month and year are required");
        return;
    }
    const sql='select * from income where user_id=? and year=?'
    connection.query(sql,[userId,year],(err,results)=>{
        if (err) {
            console.error("Error fetching income data", err);
            res.status(500).send("Server error");
            return;
        }
        res.json(results)
    })
})
app.get('/fetch_yearexpenses',(req,res)=>{
    const userId=req.session.userId
    const year=req.query.year
    if(!year){
        res.status(400).send("Month and year are required");
        return;
    }
    const sql='select * from expenses where user_id=? and year=?'
    connection.query(sql,[userId,year],(err,results)=>{
        if (err) {
            console.error("Error fetching income data", err);
            res.status(500).send("Server error");
            return;
        }
        res.json(results)
    })
})
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});