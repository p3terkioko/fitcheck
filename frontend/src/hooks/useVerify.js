import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useVerification } from '../context/VerificationContext'

export function useVerify() {
  const navigate = useNavigate()
  const {
    setCurrentResult, setCurrentClaims, setCurrentData,
    setVerificationId,
    setSourceClaim, setSourceUrl,
    setIsProcessing, setProcessingStep,
    setInputMode, setError,
  } = useVerification()

  async function verifyClaim(claimText) {
    flushSync(() => {
      setIsProcessing(true)
      setInputMode('text')
      setSourceClaim(claimText)
      setCurrentResult(null)
      setCurrentClaims(null)
      setError(null)
      setProcessingStep(0)
    })
    navigate('/processing')

    // Advance step ticker while waiting
    let step = 0
    const ticker = setInterval(() => {
      step = Math.min(step + 1, 2)
      setProcessingStep(step)
    }, 2500)

    try {
      const { result, verificationId, metadata } = await api.verify({ claim: claimText, max_results: 5 })
      console.log('[FitCheck] model:', metadata?.modelUsed)
      setProcessingStep(3)
      setCurrentResult(result)
      setVerificationId(verificationId)
      navigate('/results')
    } catch (err) {
      setError(err.message)
      navigate('/submit')
    } finally {
      clearInterval(ticker)
      setIsProcessing(false)
    }
  }

  async function analyzeUrl(url) {
    flushSync(() => {
      setIsProcessing(true)
      setInputMode('url')
      setSourceUrl(url)
      setCurrentResult(null)
      setCurrentClaims(null)
      setError(null)
      setProcessingStep(0)
    })
    navigate('/processing')

    // Advance through all 4 URL steps (fetch → transcribe → extract → verify)
    // 10s per step; caps at 3 so the last step stays active until the API returns
    let step = 0
    const ticker = setInterval(() => {
      step = Math.min(step + 1, 3)
      setProcessingStep(step)
    }, 10000)

    try {
      const { data } = await api.analyzeUrl({ url, max_results: 5 })
      setProcessingStep(3)
      setCurrentData(data)
      setCurrentClaims(data.claims || [])
      navigate('/results')
    } catch (err) {
      setError(err.message)
      navigate('/submit')
    } finally {
      clearInterval(ticker)
      setIsProcessing(false)
    }
  }

  return { verifyClaim, analyzeUrl }
}
