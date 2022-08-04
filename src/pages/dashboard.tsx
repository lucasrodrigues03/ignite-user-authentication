import Link from 'next/link'
import { useEffect } from 'react'
import { Can } from '../components/Can'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/apiClient'
import { withSSRAuth } from '../utils/withSSRAuth'

export default function Dashboard() {
  const { user, signOut, broadcastAuth } = useAuth()

  useEffect(() => {
    api
      .get('/me')
      .then(({ data }) => console.log(data))
      .catch(console.error)
  })

  function handleSignOut() {
    broadcastAuth.current.postMessage('signOut')
    signOut()
  }

  return (
    <>
      <h1>Dashboard: {user?.email ?? ''}</h1>

      <Can roles={['administrator']}>
        <h2>Metrics</h2>
      </Can>

      <p>
        <Link href="/metrics">
          <a>Access Metrics Page</a>
        </Link>
      </p>

      <button onClick={handleSignOut}>Sign Out</button>

      <Can roles={['editor']}>
        <h2>Posts</h2>
      </Can>
    </>
  )
}

export const getServerSideProps = withSSRAuth(async (ctx) => ({ props: {} }))
