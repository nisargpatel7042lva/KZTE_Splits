import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSplitStore } from '../../store/splitStore'
import { ArrowLeft } from 'lucide-react'
import CreateSplitStep1 from './steps/CreateSplitStep1'
import CreateSplitStep2 from './steps/CreateSplitStep2'
import CreateSplitStep3 from './steps/CreateSplitStep3'
import CreateSplitStep4 from './steps/CreateSplitStep4'

export default function CreateSplitPage() {
  const navigate = useNavigate()
  const { currentStep, loadDraft, clearDraft } = useSplitStore()

  useEffect(() => {
    // Load any saved draft on mount
    loadDraft()
  }, [loadDraft])

  const handleBack = () => {
    if (currentStep === 1) {
      // Ask for confirmation if leaving
      if (window.confirm('Discard this split?')) {
        clearDraft()
        navigate(-1)
      }
    } else {
      // Go to previous step within wizard
      useSplitStore.getState().previousStep()
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CreateSplitStep1 />
      case 2:
        return <CreateSplitStep2 />
      case 3:
        return <CreateSplitStep3 />
      case 4:
        return <CreateSplitStep4 />
      default:
        return <CreateSplitStep1 />
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-lg">New Split</h1>
          <p className="text-sm text-text-secondary">
            Step {currentStep} of 4
          </p>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="bg-white border-b px-4 py-3 flex justify-center gap-2">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-2 rounded-full transition-all ${
              step === currentStep
                ? 'w-8 bg-primary'
                : step < currentStep
                ? 'w-2 bg-primary'
                : 'w-2 bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-hidden">
        {renderStep()}
      </div>
    </div>
  )
}
