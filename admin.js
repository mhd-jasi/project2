const mysql=require('mysql');
const express=require('express');
const router=express.Router();


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

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.put('/update/:id',(req,res)=>{
    const userid=req.params.id;
    const{name,phone,email}=req.body;
    console.log(name,phone,email);

    connection.query('update belitehospital set name=?,phone=?,email=? where id=? ',
    [name,phone,email,userid],(error,result)=>{
        if(error){
        
            console.error("error posting");

        }

        res.send(result);
      })

    
});
router.get('/display/:id', (req, res) => {
    const userId = req.params.id; 
    connection.query('SELECT * FROM belitehospital WHERE ID = ?', [userId], (error, result) => {
        if (error) {
            console.error('Error in display:', error);
        } else {
            res.send(result);
        }
    });
});

router.delete('/delete/:id', (req, res) => {
    const userId=req.params.id;
   
    connection.query('DELETE FROM belitehospital WHERE id=?', [userId], (error, results) => {
      if (error) {
        console.error("Error deleting",error);
        
      }
      res.send({ message: "Deleted successfully" });
    });
  });


module.exports=router;