import { useState, useCallback, useRef } from 'react';

interface ImageAnalysisResult {
  label: string;
  score: number;
}

interface OfflineImageAnalysisState {
  isLoading: boolean;
  isAnalyzing: boolean;
  isSupported: boolean;
  loadProgress: number;
  error: string | null;
  lastResult: ImageAnalysisResult[] | null;
}

export const useOfflineImageAnalysis = () => {
  const [state, setState] = useState<OfflineImageAnalysisState>({
    isLoading: false,
    isAnalyzing: false,
    isSupported: typeof navigator !== 'undefined' && 'gpu' in navigator,
    loadProgress: 0,
    error: null,
    lastResult: null,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipelineRef = useRef<any>(null);
  const modelLoadedRef = useRef(false);

  const loadModel = useCallback(async () => {
    if (modelLoadedRef.current || pipelineRef.current) return true;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!('gpu' in navigator)) {
        throw new Error('WebGPU not supported for image analysis');
      }

      const { pipeline } = await import('@huggingface/transformers');
      
      pipelineRef.current = await pipeline(
        'image-classification',
        'onnx-community/mobilenetv4_conv_small.e2400_r224_in1k',
        { device: 'webgpu' }
      );

      modelLoadedRef.current = true;
      setState(prev => ({ ...prev, isLoading: false, loadProgress: 100 }));
      return true;
    } catch (err) {
      console.error('Image analysis model failed to load:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isSupported: false,
        error: err instanceof Error ? err.message : 'Failed to load model',
      }));
      return false;
    }
  }, []);

  const analyzeImage = useCallback(async (
    imageSource: string | File | Blob
  ): Promise<ImageAnalysisResult[]> => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      // Load model if not already loaded
      if (!pipelineRef.current) {
        const loaded = await loadModel();
        if (!loaded || !pipelineRef.current) {
          throw new Error('Model not available');
        }
      }

      let imageUrl: string;

      if (typeof imageSource === 'string') {
        imageUrl = imageSource;
      } else {
        // Convert File/Blob to data URL
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageSource);
        });
      }

      const results = await pipelineRef.current(imageUrl, { top_k: 5 });
      
      const analysisResults: ImageAnalysisResult[] = (results as Array<{ label: string; score: number }>).map(r => ({
        label: r.label,
        score: r.score,
      }));

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        lastResult: analysisResults,
      }));

      return analysisResults;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Image analysis failed';
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error,
        lastResult: null,
      }));
      return [];
    }
  }, [loadModel]);

  const describeImage = useCallback(async (
    imageSource: string | File | Blob
  ): Promise<string> => {
    const results = await analyzeImage(imageSource);
    
    if (results.length === 0) {
      return 'Could not analyze the image.';
    }

    const topResults = results.slice(0, 3);
    const confidence = topResults[0].score;
    
    if (confidence > 0.8) {
      return `This appears to be: ${topResults[0].label} (${(confidence * 100).toFixed(1)}% confident)`;
    } else if (confidence > 0.5) {
      return `This looks like it could be: ${topResults.map(r => r.label).join(', ')}`;
    } else {
      return `Possible matches: ${topResults.map(r => `${r.label} (${(r.score * 100).toFixed(1)}%)`).join(', ')}`;
    }
  }, [analyzeImage]);

  const unloadModel = useCallback(() => {
    pipelineRef.current = null;
    modelLoadedRef.current = false;
    setState(prev => ({ ...prev, loadProgress: 0, lastResult: null }));
  }, []);

  return {
    ...state,
    loadModel,
    analyzeImage,
    describeImage,
    unloadModel,
    isModelLoaded: modelLoadedRef.current,
  };
};
