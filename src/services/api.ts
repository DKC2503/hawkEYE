import type { HawkEyeVisionResult } from '../types/reportFlow';
import { apiFetch } from '../utils/apiClient';

export class ApiError extends Error {
  code: string;

  constructor(message: string, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export class VisionApiService {
  async analyzeImage(imageFile: File): Promise<HawkEyeVisionResult> {
    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const response = await apiFetch('/api/vision/analyze', {
        method: 'POST',
        body: formData,
      });


      if (!response.ok) {
        let errorMessage = `API server responded with status ${response.status}`;
        let errorCode = 'UNKNOWN_ERROR';

        try {
          const errorData = await response.json();
          if (errorData && errorData.detail) {
            const rawDetail = typeof errorData.detail === 'string'
              ? errorData.detail
              : JSON.stringify(errorData.detail);

            // Extract bracketed error code like [GEMINI_AUTH_ERROR]
            const match = rawDetail.match(/^\[([A-Z_]+)\]\s*(.*)$/);
            if (match) {
              errorCode = match[1];
              errorMessage = match[2];
            } else {
              errorMessage = rawDetail;
            }
          }
        } catch {
          // Response body was not JSON
        }
        throw new ApiError(errorMessage, errorCode);
      }

      const data: HawkEyeVisionResult = await response.json();
      return data;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      if (err instanceof Error) {
        throw new ApiError(err.message, 'BACKEND_UNREACHABLE');
      }
      throw new ApiError('An unexpected network error occurred while connecting to hawkEYE Vision service.', 'UNKNOWN_ERROR');
    }
  }
}

export const visionApi = new VisionApiService();
