import { useState } from "react"
import { useMutation } from "@apollo/client"
import { ALL_AUTHORS, SET_BORN } from "../queries"

const SetBorn = ({authors, setError}) => {

    const [name, setName] = useState('')
    const [born, setBorn] = useState('')

    const [setAuthorBorn] = useMutation(SET_BORN, {
        refetchQueries: [{query: ALL_AUTHORS}],
        onError: (error) => {
            setError(error.graphQLErrors[0].message)
        }
    })

    const handleSumbmit = (event) => {
        event.preventDefault()
        if (!name || !born) return

        setAuthorBorn({
            variables: {name, setBornTo: parseInt(born)}
        })

        setName('')
        setBorn('')
    }
    return (
        <div>
        <h2>Set birthyear</h2>
        <form onSubmit={handleSumbmit}>
          <div>
            <select onChange={e => setName(e.target.value)} value={name} style={{height: '30px', width: '250px', backgroundColor: '#f3f3f3'}}>
                <option value='' > Select an author </option>
                {
                    authors.map(author => <option value={author} key={author} >{author}</option>)
                }
            </select>
          </div>
          <div>born <input type='number' onChange={e => setBorn(e.target.value)} value={born} /> </div>
          <button type="submit">update author</button>
        </form>
      </div>
    )
}

export default SetBorn