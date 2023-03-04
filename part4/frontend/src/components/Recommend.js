import { useQuery } from "@apollo/client"
import { useState, useEffect } from "react"
import { ME, ALL_BOOKS } from "../queries" 

const Recommend = (props) => {

  const [favGenr, setFavGenre] = useState(null)
  
  const result = useQuery(ME)
  const resultBooks = useQuery(ALL_BOOKS, {
    variables: {
        genre: favGenr
    }
  })

  useEffect(() => {
    if (result.data && result.data.me) {
        setFavGenre(result.data.me.favouriteGenre)
    }
  }, [result.data])

  if (!props.show) {
    return null
  }

  if (resultBooks.loading) return <p>Loading</p>

  let books = resultBooks.data.allBooks

  return (
    <div>
      <h2>Recommendations</h2>

      <p>books in your favorite genre <span style={{fontWeight: "bold"}}>{favGenr}</span></p>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Recommend
