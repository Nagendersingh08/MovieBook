import React, { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const Loading = () => {

  const { nextUrl } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { axios, getToken } = useAppContext()

  useEffect(()=>{
    let timeoutId

    const confirmPayment = async () => {
      const sessionId = searchParams.get('session_id')

      if (sessionId) {
        try {
          const token = await getToken()
          await axios.get('/api/booking/confirm-payment', {
            params: { session_id: sessionId },
            headers: { Authorization: `Bearer ${token}` }
          })
        } catch (error) {
          console.error(error)
        }
      }

      if(nextUrl){
        timeoutId = setTimeout(()=>{
          navigate('/' + nextUrl)
        },1500)
      }
    }

    confirmPayment()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  },[axios, getToken, navigate, nextUrl, searchParams])

  return (
    <div className='flex justify-center items-center h-[80vh]'>
        <div className='animate-spin rounded-full h-14 w-14 border-2 border-t-primary'></div>
    </div>
  )
}

export default Loading
