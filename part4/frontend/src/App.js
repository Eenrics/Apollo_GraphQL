import { useState, useEffect } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
import Notify from './components/Notify'
import Recommend from './components/Recommend'
import { useApolloClient } from '@apollo/client'
import { ME } from './queries'
import { useQuery } from '@apollo/client'

const App = () => {
  const [page, setPage] = useState('authors')
  const [errorMessage, setErrorMessage] = useState(null)
  const [token, setToken] = useState(null)
  const client = useApolloClient()

  useEffect(() => {
    const token = localStorage.getItem('library-user-token')
    if (token) {
      setToken(token)
    }
  })

  
  const logout = () => {
    setPage('authors')
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }
  
  const notify = (mssg) => {
    setErrorMessage(mssg)
    setTimeout(() => {
      setErrorMessage(null)
    }, 5*1000)
  }
  
  // const favGenr = useQuery(ME)
  // if (favGenr.loading) return <p>Loading</p>

  return (
    <div>
      <Notify errorMessage={errorMessage} />
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {token ? <button onClick={() => setPage('add')}>add book</button> : null}
        {token ? <button onClick={() => setPage('recommend')}>recommendations</button> : null}
        {
          token ? <button onClick={() => logout()}>Logout</button> : <button onClick={() => setPage('login')}>Login</button>
        }
      </div>

      <Authors show={page === 'authors'} setError={notify} token={token} />

      <Books show={page === 'books'} token={token}/>

      <NewBook show={page === 'add'} setError={notify} />

      {token ? 
      <Recommend show={page === 'recommend'} setError={notify} /> :
      null}

      <LoginForm show={page === 'login'} setToken={setToken} setError={notify} setPage={setPage} />
    </div>
  )
}

export default App
