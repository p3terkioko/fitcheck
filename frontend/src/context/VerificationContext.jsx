import { createContext, useContext, useState } from 'react'

export const VerificationContext = createContext(null)

export function VerificationProvider({ children }) {
  const [currentResult, setCurrentResult] = useState(null)
  const [currentClaims, setCurrentClaims] = useState(null)
  const [currentData, setCurrentData] = useState(null)
  const [verificationId, setVerificationId] = useState(null) // for text claims
  const [sourceClaim, setSourceClaim] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [inputMode, setInputMode] = useState('text')
  const [error, setError] = useState(null)

  function reset() {
    setCurrentResult(null)
    setCurrentClaims(null)
    setCurrentData(null)
    setVerificationId(null)
    setSourceClaim('')
    setSourceUrl('')
    setIsProcessing(false)
    setProcessingStep(0)
    setError(null)
  }

  return (
    <VerificationContext.Provider value={{
      currentResult, setCurrentResult,
      currentClaims, setCurrentClaims,
      currentData, setCurrentData,
      verificationId, setVerificationId,
      sourceClaim, setSourceClaim,
      sourceUrl, setSourceUrl,
      isProcessing, setIsProcessing,
      processingStep, setProcessingStep,
      inputMode, setInputMode,
      error, setError,
      reset,
    }}>
      {children}
    </VerificationContext.Provider>
  )
}

export function useVerification() {
  const ctx = useContext(VerificationContext)
  if (!ctx) throw new Error('useVerification must be used inside VerificationProvider')
  return ctx
}
