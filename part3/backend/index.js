const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
// const { v1: uuid } = require('uuid')
const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const jwt = require('jsonwebtoken')
const { GraphQLError } = require('graphql') 

mongoose.set('strictQuery', false)

require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI

console.log('connecting to', MONGODB_URI)
mongoose.connect(MONGODB_URI)
.then(() => {
  console.log("connected to MongoDB")
})
.catch((error) => {
  console.log('error connection to MongoDB:', error.message)
})

const verify = (ele) => jwt.verify(ele, process.env.JWT_SECRET)

const typeDefs = `

  type Book {
    title: String!
    published: Int!
    author: Author!
    id: String!
    genres: [String]!
  }

  type Author {
    name: String!
    id: String!
    born: Int
    bookCount: Int
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
    createUser(
      username: String!
      favouriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }

  type User {
    username: String!
    favouriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }
`

const resolvers = {
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
        let response = []
        if (args.author) {
          console.log(args.author)
          let author = await Author.findOne({name: args.author})
          let book = await Book.find({author}).populate('author')
          response = response.concat(book)
        }
        if (args.genre) {
          let book = await Book.find({genres: args.genre}).populate('author')
          console.log(book)
          response = response.concat(book)
        }
        if (!args.author && !args.genre) {
          let book = await Book.find({}).populate('author')
          response = response.concat(book)
        }
        return response
    },
    allAuthors: async () => Author.find({}),
    me: (root, args, {currUser}) => currUser
  },
  Author: {
    bookCount: async (root) => {
        return (
            (await Book.find({author: root})).length
        )
    }
  },
  Mutation: {
    addBook: async (root, args, {currUser}) => {

      if (!currUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT',
          }
        })
      }

        let authors = await Author.find({})
        let author = authors.find(a => a.name === args.author)
        if (!author) {
            author = new Author({name: args.author})
            try {
              await author.save()
            } catch (error) {
              throw new GraphQLError('Saving author failed', {
                extensions: {
                  code: 'BAD_USER_INPUT',
                  invalidArgs: args.author,
                  reason: error.errors.name.message,
                  error
                }
              })
            }
        }
        const book = new Book({...args, author})
        try {
          await book.save()
        } catch (error) {
          throw new GraphQLError('Saving book failed', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.title,
              reason: error.errors.title.message,
              error
            }
          })
        }
        return book
    },
    editAuthor: async (root, args, {currUser}) => {

      if (!currUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT',
          }
        })
      }

        let author = await Author.findOne({name: args.name})
        if (!author) return null
        author.born = args.setBornTo
        console.log(author)
        return  author.save()
    },
    createUser: async (root, args) => {
      let user = new User({username: args.username})

      try {
        await user.save()
      } catch (error) {
        throw new GraphQLError('Saving user failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.username,
            reason: error.errors.username.message,
            error
          }
        })
      }

      return user
    },
    login: async (root, args) => {
      let user = await User.findOne({username: args.username})

      if (!user || args.password !== 'password') {
        throw new GraphQLError('Unauthorized user', {
          extensions: {
            code: 'BAD_USER_INPUT',
            reason: 'invalid username or password'
          }
        })
      }

      const userToken = {
        username: user.username,
        id: user._id,
      }

      let encToken = jwt.sign(userToken, process.env.JWT_SECRET)
      return { value: encToken }
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req, res }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.startsWith('Bearer ')) {
      const decToken = jwt.verify(
        auth.substring(7), process.env.JWT_SECRET
        )
        const currUser = await User.findById(decToken.id).populate()
      return { currUser }
    }
  },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})