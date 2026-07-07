import React, { useState } from 'react';
import { StepProgress } from '../features/report/StepProgress';
import { IssueImageCapture } from '../features/report/IssueImageCapture';
import { IssueLocationCapture } from '../features/report/IssueLocationCapture';
import { IssueAnalysis } from '../features/report/IssueAnalysis';
import { IssueConfirmation } from '../features/report/IssueConfirmation';
import { IssueSubmissionStatus } from '../features/report/IssueSubmissionStatus';
import { DuplicateConfirmationCard } from '../features/reportFlow/DuplicateConfirmationCard';
import { visionApi, ApiError } from '../services/api';
import { issueApiService, type CreatedIssueReceipt, type DuplicateCandidate } from '../services/issueApiService';
import { useGeolocation } from '../hooks/useGeolocation';
import type { ReportStep, ReportFormData, HawkEyeVisionResult } from '../types/reportFlow';
import type { IssueCategory, IssueSeverity } from '../types/civic';

export const ReportPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<ReportStep>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const [duplicateCandidate, setDuplicateCandidate] = useState<DuplicateCandidate | null>(null);
  const [userConfirmedDifferent, setUserConfirmedDifferent] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  const geo = useGeolocation();

  const [formData, setFormData] = useState<ReportFormData>({
    imageFile: undefined,
    imagePreviewUrl: undefined,
    location: undefined,
    locationStatus: 'idle',
    locationErrorMessage: undefined,
    aiState: 'idle',
    detectedCategory: 'pothole',
    category: 'pothole',
    aiSummary: '',
    visibleRisk: '',
    description: '',
    severity: 'medium',
    aiConfidence: 0.90,
    submissionState: 'ready',
  });

  const activeLocation = geo.location || formData.location || null;

  const handleLocateMe = () => {
    geo.requestLocation();
  };

  const handleRunVisionAnalysis = async () => {
    if (formData.aiState === 'analyzing') return;
    if (!formData.imageFile) {
      setErrorMessage('No image selected to analyze.');
      setErrorCode('INVALID_IMAGE');
      return;
    }

    setErrorMessage(null);
    setErrorCode(null);
    setFormData((prev) => ({ ...prev, aiState: 'analyzing' }));

    try {
      const result: HawkEyeVisionResult = await visionApi.analyzeImage(formData.imageFile);

      let mappedCategory: IssueCategory = 'other';
      const catUpper = result.category.toUpperCase();
      if (catUpper.includes('POTHOLE')) mappedCategory = 'pothole';
      else if (catUpper.includes('ROAD_DAMAGE') || catUpper.includes('ROAD')) mappedCategory = 'road_damage';
      else if (catUpper.includes('STREETLIGHT')) mappedCategory = 'streetlight';
      else if (catUpper.includes('GARBAGE')) mappedCategory = 'garbage';
      else if (catUpper.includes('WATER_LEAK') || catUpper.includes('WATER')) mappedCategory = 'water_leak';
      else if (catUpper.includes('FLOODING') || catUpper.includes('FLOOD')) mappedCategory = 'flooding';
      else if (catUpper.includes('DRAINAGE')) mappedCategory = 'drainage';
      else if (catUpper.includes('DAMAGED_INFRASTRUCTURE') || catUpper.includes('INFRASTRUCTURE')) mappedCategory = 'damaged_infrastructure';

      let mappedSeverity: IssueSeverity = 'medium';
      const sevUpper = result.severity.toUpperCase();
      if (sevUpper === 'LOW') mappedSeverity = 'low';
      else if (sevUpper === 'HIGH') mappedSeverity = 'high';
      else if (sevUpper === 'CRITICAL') mappedSeverity = 'critical';

      setFormData((prev) => ({
        ...prev,
        aiState: 'success',
        visionResult: result,
        detectedCategory: mappedCategory,
        category: mappedCategory,
        severity: mappedSeverity,
        aiSummary: result.summary,
        visibleRisk: result.visible_risk,
        aiConfidence: result.confidence,
        description: prev.description || `${result.summary} ${result.visible_risk}`.trim(),
      }));
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
        setErrorCode(err.code);
      } else if (err instanceof Error) {
        setErrorMessage('The service is temporarily unavailable. Please try again shortly.');
        setErrorCode('BACKEND_UNREACHABLE');
      } else {
        setErrorMessage('We couldn\'t process the request. Please try again.');
        setErrorCode('UNKNOWN_ERROR');
      }
      setFormData((prev) => ({ ...prev, aiState: 'failed' }));
    }
  };

  // Step 4 -> Step 5 transition with Duplicate Check
  const handleProceedToConfirmation = async () => {
    if (checkingDuplicate) return;
    if (activeLocation && !userConfirmedDifferent) {
      setCheckingDuplicate(true);
      try {
        const dupRes = await issueApiService.checkDuplicate(
          activeLocation,
          formData.category,
          formData.imageFile
        );

        if (dupRes.duplicateDetected && dupRes.candidates.length > 0) {
          setDuplicateCandidate(dupRes.candidates[0]);
          setCheckingDuplicate(false);
          return;
        }
      } catch {
        // Continue if check fails
      } finally {
        setCheckingDuplicate(false);
      }
    }
    setCurrentStep(5);
  };

  const handleFinalSubmission = async () => {
    if (formData.submissionState === 'submitting') return;
    const activeLoc = geo.location || formData.location;

    if (!formData.imageFile) {
      setFormData((prev) => ({
        ...prev,
        submissionState: 'failure',
        submissionError: 'Please attach an issue photo before submitting.',
        submissionErrorCode: 'INVALID_IMAGE',
      }));
      return;
    }

    if (!activeLoc) {
      setFormData((prev) => ({
        ...prev,
        submissionState: 'failure',
        submissionError: 'Please capture your location in Step 2 before submitting.',
        submissionErrorCode: 'LOCATION_REQUIRED',
      }));
      return;
    }

    const currentIdempotencyKey = formData.idempotencyKey || `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    setFormData((prev) => ({
      ...prev,
      submissionState: 'submitting',
      submissionError: null,
      submissionErrorCode: null,
      idempotencyKey: currentIdempotencyKey,
    }));

    try {
      const receipt: CreatedIssueReceipt = await issueApiService.submitIssue({
        imageFile: formData.imageFile,
        location: activeLoc,
        category: formData.category,
        description: formData.description,
        severity: formData.severity,
        visionResult: formData.visionResult,
        idempotencyKey: currentIdempotencyKey,
        userConfirmedDifferent: userConfirmedDifferent,
      });

      setFormData((prev) => ({
        ...prev,
        submissionState: 'success',
        createdReceipt: receipt,
      }));
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'POSSIBLE_DUPLICATE' && (err as any).candidates?.length > 0) {
          setDuplicateCandidate((err as any).candidates[0]);
          setCurrentStep(4);
          setFormData((prev) => ({ ...prev, submissionState: 'ready' }));
          return;
        }

        setFormData((prev) => ({
          ...prev,
          submissionState: 'failure',
          submissionError: err.message,
          submissionErrorCode: err.code,
        }));
      } else if (err instanceof Error) {
        setFormData((prev) => ({
          ...prev,
          submissionState: 'failure',
          submissionError: 'The service is temporarily unavailable. Please try again shortly.',
          submissionErrorCode: 'BACKEND_UNREACHABLE',
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          submissionState: 'failure',
          submissionError: 'We couldn\'t process the request. Please try again.',
          submissionErrorCode: 'UNKNOWN_ERROR',
        }));
      }
    }
  };

  const handleResetFlow = () => {
    setFormData({
      imageFile: undefined,
      imagePreviewUrl: undefined,
      location: undefined,
      locationStatus: 'idle',
      aiState: 'idle',
      category: 'pothole',
      description: '',
      severity: 'medium',
      submissionState: 'ready',
      submissionError: null,
      submissionErrorCode: null,
      createdReceipt: null,
      idempotencyKey: undefined,
    });
    setDuplicateCandidate(null);
    setUserConfirmedDifferent(false);
    setErrorMessage(null);
    setErrorCode(null);
    setCurrentStep(1);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <StepProgress currentStep={currentStep} onStepClick={(step) => setCurrentStep(step)} />

      {currentStep === 1 && (
        <IssueImageCapture
          imageFile={formData.imageFile}
          imagePreviewUrl={formData.imagePreviewUrl}
          onImageSelected={(file, url) => setFormData((prev) => ({ ...prev, imageFile: file, imagePreviewUrl: url, aiState: 'idle' }))}
          onImageRemoved={() => setFormData((prev) => ({ ...prev, imageFile: undefined, imagePreviewUrl: undefined, aiState: 'idle' }))}
          onNext={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 2 && (
        <IssueLocationCapture
          location={activeLocation}
          status={geo.status}
          errorMessage={geo.error}
          diagnostics={geo.diagnostics}
          onLocateMe={handleLocateMe}
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 3 && (
        <IssueAnalysis
          aiState={formData.aiState}
          errorMessage={errorMessage}
          errorCode={errorCode}
          visionResult={formData.visionResult}
          hasImage={!!formData.imageFile}
          onRunAnalysis={handleRunVisionAnalysis}
          onNext={() => setCurrentStep(4)}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 4 && (
        duplicateCandidate && !userConfirmedDifferent ? (
          <DuplicateConfirmationCard
            candidate={duplicateCandidate}
            onConfirmDifferent={() => {
              setUserConfirmedDifferent(true);
              setDuplicateCandidate(null);
              setCurrentStep(5);
            }}
            onSuccessHandRaised={() => {
              handleResetFlow();
            }}
          />
        ) : (
          <IssueConfirmation
            imagePreviewUrl={formData.imagePreviewUrl}
            location={activeLocation}
            category={formData.category}
            description={formData.description}
            severity={formData.severity}
            onCategoryChange={(cat) => setFormData((prev) => ({ ...prev, category: cat }))}
            onDescriptionChange={(desc) => setFormData((prev) => ({ ...prev, description: desc }))}
            onSeverityChange={(sev) => setFormData((prev) => ({ ...prev, severity: sev }))}
            onNext={handleProceedToConfirmation}
            onBack={() => setCurrentStep(3)}
            disabled={checkingDuplicate}
          />
        )
      )}

      {currentStep === 5 && (
        <IssueSubmissionStatus
          submissionState={formData.submissionState}
          errorMessage={formData.submissionError}
          errorCode={formData.submissionErrorCode}
          createdReceipt={formData.createdReceipt}
          onSubmit={handleFinalSubmission}
          onReset={handleResetFlow}
        />
      )}
    </div>
  );
};
