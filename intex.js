var express=require('express');
const mysql=require('mysql');
var app=express();
const nodemailer=require('nodemailer');
const session = require('express-session');
const admin =require('./admin.js');
const router = require('./admin.js');
app.use('/admin',admin);
app.use(express.json()); // To parse JSON in requests
app.use("/", router);
const path=require('path');
const puppeteer=require('puppeteer');
const fs = require('fs');






const connection=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'nodepro1'
})
connection.connect((error)=>{
    if(error){
        console.error('error database connecting');
        return;
    }
    console.log('connected'+connection.threadId);
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'defaultsecret',
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 // 1 day (in milliseconds)
        }
    })
);

app.post('/register',(req,res)=>{
    const { name,phone,username,password,email,category} = req.body; 
    const OTP = Math.floor(100000 + Math.random() * 900000);
    console.log(OTP);

    var transport = nodemailer.createTransport({
        service: 'gmail',
        auth:{
           user: 'jasimp412@gmail.com',
           pass: 'tqew iemy cakr mwqs'
        }
     });
     message = {
        from: "jasimp412@gmail.com",
        to: email,
        subject: "OTP of your Registration",
        text:`your OTP is ${OTP}`

     }
     transport.sendMail(message, function(err, info) {
        if (err) {
           res.json({message:"Not able to send OTP"});
         }
         else {
            req.session.user = { name: name, phone:phone,username:username,
                password:password,email:email,otp:OTP,category:category};
           
        console.log("send otp")
        res.json({message:"Check your Email for OTP"});
     }
     });
    });
    
    app.post('/otp', (req, res) => {
        const { OTP } = req.body;
    
        if (!req.session.user) {
            return res.status(400).send('Session expired or user not found');
        }
    
        const { name,phone,username,password,email, otp ,category} = req.session.user;
    
        // Validate OTP
        if (parseInt(OTP) !== otp) {
            
            
            return res.status(400).send('Invalid OTP');
        }
    
        
    
            connection.query(
                'INSERT INTO belitehospital(name,phone,username,password,email,category) VALUES (?, ?, ?, ?, ?,?)',[name,phone,username,password,email,category],
                (error, results) => {
                    if (error) {
                        console.log(req.session.user);
                        
                        console.error('Error inserting data:', error);
                        return res.status(500).send('Error inserting data');
                    }
                    res.json({ message: 'User registered successfully' });
                }
            );
        });
    
    
    // User login
    app.post('/login', (req, res) => {
        if(req.session.userid ){
            res.json({message:"Already Logged In"});
        }
        else{
        const { email, password } = req.body;
    
        connection.query('SELECT * FROM belitehospital WHERE email = ? and password=?', [email,password], (error, results) => {
            if (error) {
                return res.status(500).send('Error fetching user');
            }
    
            if (results.length === 0) {
                return res.status(400).send('User not found');
            }
    
           
    
                if (!results) {
                    return res.status(400).send('Invalid credentials');
                }
    
                req.session.userid = email;
                res.json({ message: 'You are successfully logged in' });
            })};
        });
   
    
    ////// User logout//////
    app.get('/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to log out' });
            }
            res.json({ message: 'Logged out successfully' });
        });
    });

    app.post('/booking',(req,res)=>{
        const {name,age,phone,place,address,email,doctor} = req.body;
        connection.query("INSERT INTO booking(Name,Age,Phone,Place,Address,Email,Doctor) VALUES (?,?,?,?,?,?,?)",[name,age,phone,place,address,email,doctor],(err,result)=>{
            if(err){
                res.json({error:'error booking'})
                console.log(err);
            }
            res.json({message:'booking successfully created'})
            console.log(result)
        })
    })

app.delete('/delbooking/:id', (req, res) => {
    const userid=req.params.id;
    connection.query('DELETE FROM booking WHERE id=?', [userid], (error, results) => {
      if (error) {
        console.error("Error deleting",error);
        
      }
      res.send({ message: "Booking deleted successfully"});
    });
  });
 


app.get('/peric/:id', async (req, res) => {
    const { id } = req.params;

    // Simulate database query (replace this with your actual database logic)
    connection.query('SELECT * FROM booking WHERE id = ?', [id], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        // Check if results contain any rows
        if (!results || results.length === 0) {
            console.warn('No booking found for the given ID');
            return res.status(404).send('No booking found');
        }

        // Safely destructure values from the first row
        const { Name: name, Age: age, Phone: phone, Place: place, Address: address, Email: email, Doctor: doctor } = results[0];
        const generatePrescription = async () => {
        try {
            // Load HTML template
            const htmlTemplate = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');

            // Replace placeholders with actual data
            const date = new Date().toLocaleDateString();
            const filledHtml = htmlTemplate
                .replace(/{{patientName}}/g, name)
                .replace(/{{Age}}/g, age)
                .replace(/{{Phone}}/g, phone)
                .replace(/{{Place}}/g, place)
                .replace(/{{Address}}/g, address)
                .replace(/{{Email}}/g, email)
                .replace(/{{doctor}}/g, doctor);

            // Ensure the prescriptions directory exists
            const prescriptionsDir = path.join(__dirname, 'prescriptions');
            if (!fs.existsSync(prescriptionsDir)) {
                fs.mkdirSync(prescriptionsDir);
            }

            // Generate the path for the PDF file
            const pdfPath = path.join(prescriptionsDir, `prescription-${id}.pdf`);

            // Generate the PDF
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(filledHtml);
            await page.pdf({ path: pdfPath, format: 'A4' });

            await browser.close();

            console.log('Prescription PDF generated at:', pdfPath);

            // Send response
            const pdfUrl = `/prescriptions/prescription-${id}.pdf`;
            res.json({
                message: 'Prescription generated successfully',
                downloadUrl: pdfUrl,
                printUrl: pdfUrl
            });
        } catch (error) {
            console.error('Error generating prescription:', error);
            res.status(500).send('Error generating the prescription.');
        }
        };
        await generatePrescription();
    });

});
app.use('/prescriptions', express.static(path.join(__dirname, 'prescriptions')));

app.listen(3000);