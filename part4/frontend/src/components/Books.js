import { useQuery } from "@apollo/client"
import { ALL_BOOKS } from "../queries"
import { useState } from "react"

const Books = (props) => {

  const [genre, setGenre] = useState(null)
  const [genreList, setGenreList] = useState(null)
  
  const result = useQuery(ALL_BOOKS, {
    variables: {
      genre
    }
  })
  if (!props.show) {
    return null
  }

  if (result.loading) return <p>Loading</p>

  const books = result.data.allBooks
  const genres = new Set()
  for (let i = 0; i < books.length; i++) {
    for (let j = 0; j < books[i].genres.length; j++) {
      genres.add(books[i].genres[j])
    }
  }
  if (!genreList) setGenreList(Array.from(genres))

  return (
    <div>
      <h2>books</h2>

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
      {
        props.token ? (
          genreList ? genreList.map(genre => <button key={genre} onClick={() => setGenre(genre)}>{genre}</button>) : null
        ) : null
      }
    </div>
  )
}

export default Books
