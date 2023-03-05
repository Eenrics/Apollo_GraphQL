const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const schemaAuthor = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    minlength: 4
  },
  born: {
    type: Number,
  },
})

const schemaBook = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        minlength: 5
    },
    published: {
        type: Number,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Author'
    },
    genres: [
        { type: String}
    ]
})

schemaAuthor.plugin(uniqueValidator)
schemaBook.plugin(uniqueValidator)

const Author = mongoose.model('Author', schemaAuthor)
const Book = mongoose.model('Book', schemaBook)
  



// Connect with mongo DB

mongoose.set('strictQuery', false)
require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI

console.log('connecting to', MONGODB_URI)
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
    
    // Insert data into mongodb
    
      Author.insertMany([
        {
          name: 'Robert Martin',
          born: 1952
        }
      ]).then(function(){
        console.log("Data inserted Success")
    }).catch(function(error){
        console.log(error, 'Failure')
    });
    
      Book.insertMany([
        {
          title: 'Clean Code',
          published: 2008,
          author: 'Robert Martin',
          genres: ['refactoring']
        },
        {
          title: 'Agile software development',
          published: 2002,
          author: 'Robert Martin',
          genres: ['agile', 'patterns', 'design']
        }
      ]).then(function(){
        console.log("Data inserted Success")
    }).catch(function(error){
        console.log(error, 'Failure')
    });
    
    mongoose.connection.close()

  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })


