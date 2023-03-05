const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const jwt = require('jsonwebtoken')
const { GraphQLError } = require('graphql') 
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()

const resolvers = {
    Query: {
      bookCount: async () => Book.collection.countDocuments(),
      authorCount: async () => Author.collection.countDocuments(),
      allBooks: async (root, args, {currUser}) => {
          let response = []
          if (args.author) {
            console.log(args.author)
            let author = await Author.findOne({name: args.author})
            let book = await Book.find({author}).populate('author')
            response = response.concat(book)
          }
          if (args.genre) {
            let book = await Book.find({genres: args.genre}).populate('author')
            response = response.concat(book)
            currUser.favouriteGenre = args.genre
            await currUser.save()
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
              // (await Book.find({author: root})).length
              root.books ? root.books.length : 0
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
          author.books = author.books ? author.books.concat(book) : [book]
          try {
            await book.save()
            await author.save()
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
          pubsub.publish('BOOK_ADDED', { bookAdded: book })
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
        let user = new User({username: args.username, favouriteGenre: ''})
  
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
    },
    Subscription: {
        bookAdded: {
          subscribe: () => pubsub.asyncIterator('BOOK_ADDED')
        },
      },
  }
  
module.exports = resolvers