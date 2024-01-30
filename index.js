import express from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.get('/login', (req, res) => {
  res.send('<h1>Hello Anurag Dwivedi!</h1>')
})

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`)
})