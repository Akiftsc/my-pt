"use client"
import React, { useState, useEffect, useRef } from 'react';
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm';

function UploadVideo() {
  const [status, setStatus] = useState('Upload a video to analyze your movement technique.');
  const [isIOS, setIsIOS] = useState(false);
  const [AIresponse, setAIresponse] = useState<string>();
  const [isClient, setIsClient] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsClient(true);
    // iOS Safari detection
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOS(isIOSDevice);
    }
  }, []);

  const checkVideoDuration = async (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      
      video.onerror = () => {
        reject(new Error('Video metadata yüklenemedi'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };
  const compressVideo = async (videoBlob: Blob | File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // iOS Safari MediaRecorder desteği sınırlı - iPhone'da kompresyon işlemini atla
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIOSDevice) {
        console.warn('iOS device detected - skipping compression due to MediaRecorder limitations');
        resolve(videoBlob);
        return;
      }

      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      
      video.onloadedmetadata = async () => {
        try {
          // Create canvas for frame capture
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          // Set compressed dimensions
          const maxWidth = 640;
          const maxHeight = 480;
          const aspectRatio = video.videoWidth / video.videoHeight;
          
          if (aspectRatio > 1) {
            canvas.width = Math.min(maxWidth, video.videoWidth);
            canvas.height = canvas.width / aspectRatio;
          } else {
            canvas.height = Math.min(maxHeight, video.videoHeight);
            canvas.width = canvas.height * aspectRatio;
          }

          // Try to use MediaRecorder for better compression
          if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            const stream = canvas.captureStream(15); // 15 FPS for compression
            const recorder = new MediaRecorder(stream, {
              mimeType: 'video/webm;codecs=vp8',
              videoBitsPerSecond: 500000 // 500 kbps
            });

            const chunks: BlobPart[] = [];
            recorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                chunks.push(event.data);
              }
            };

            recorder.onstop = () => {
              const compressedBlob = new Blob(chunks, { type: 'video/webm' });
              resolve(compressedBlob);
            };

            recorder.onerror = () => {
              reject(new Error('MediaRecorder failed'));
            };

            // Start recording
            recorder.start();

            // Play the entire video and capture all frames
            video.currentTime = 0;
            video.play();

            const captureFrames = () => {
              if (!video.ended && !video.paused) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                requestAnimationFrame(captureFrames);
              }
            };

            video.onplay = () => {
              captureFrames();
            };

            video.onended = () => {
              recorder.stop();
            };

            // Auto-stop after original duration plus buffer
            setTimeout(() => {
              if (recorder.state === 'recording') {
                recorder.stop();
              }
            }, video.duration * 1000 + 2000); // Original duration + 2 second buffer

          } else {
            // Fallback: just return original blob if MediaRecorder not supported
            resolve(videoBlob);
          }
        } catch (error) {
          reject(error);
        }
      };

      video.onerror = () => reject(new Error('Video loading failed'));
      video.src = URL.createObjectURL(videoBlob);
      video.load();
    });
  };  const removeAudio = async (videoBlob: Blob): Promise<Blob> => {
    return new Promise((resolve) => {
      // iOS Safari MediaRecorder desteği sınırlı - iPhone'da ses kaldırma işlemini atla
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIOSDevice) {
        console.warn('iOS device detected - skipping audio removal due to MediaRecorder limitations');
        resolve(videoBlob);
        return;
      }

      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      
      video.onloadedmetadata = async () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.warn('Canvas context not available, returning original blob');
            resolve(videoBlob);
            return;
          }

          // Set canvas dimensions
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Check if MediaRecorder is available and supports video without audio
          if (typeof MediaRecorder !== 'undefined') {
            const stream = canvas.captureStream(30); // 30 FPS for better quality
            
            // Remove audio tracks if any exist
            stream.getAudioTracks().forEach(track => {
              stream.removeTrack(track);
              track.stop();
            });

            // Use video/webm for better browser support, but prefer MP4 if available
            let mimeType = 'video/mp4';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = 'video/webm;codecs=vp8';
              if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                  console.warn('No supported video format found, returning original');
                  resolve(videoBlob);
                  return;
                }
              }
            }

            const recorder = new MediaRecorder(stream, {
              mimeType,
              videoBitsPerSecond: 1000000 // 1 Mbps for good quality
            });

            const chunks: BlobPart[] = [];
            recorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                chunks.push(event.data);
              }
            };            recorder.onstop = () => {
              const audioFreeBlob = new Blob(chunks, { type: mimeType });
              console.log('Audio removal completed - MIME type:', mimeType);
              console.log('Audio removal completed - Blob size:', audioFreeBlob.size);
              console.log('Audio removal completed - Blob type:', audioFreeBlob.type);
              resolve(audioFreeBlob);
            };

            recorder.onerror = (error) => {
              console.error('MediaRecorder error:', error);
              resolve(videoBlob); // Fallback to original
            };            // Start recording
            recorder.start();

            // Native video playback approach - preserves full duration
            video.currentTime = 0;
            video.play();

            const captureFrames = () => {
              if (!video.ended && !video.paused) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                requestAnimationFrame(captureFrames);
              }
            };

            video.onplay = () => {
              captureFrames();
            };

            video.onended = () => {
              recorder.stop();
            };

            // Auto-stop after original duration plus buffer to ensure completion
            setTimeout(() => {
              if (recorder.state === 'recording') {
                recorder.stop();
              }
            }, video.duration * 1000 + 2000); // Original duration + 2 second buffer

          } else {
            console.warn('MediaRecorder not supported, returning original blob');
            resolve(videoBlob);
          }
        } catch (error) {
          console.error('Audio removal error:', error);
          resolve(videoBlob); // Fallback to original
        }
      };

      video.onerror = () => {
        console.error('Video loading failed for audio removal');
        resolve(videoBlob); // Fallback to original
      };
      
      video.src = URL.createObjectURL(videoBlob);
      video.load();
    });
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStatus('Video işleniyor...');      // Check initial file size
      if (file.size > 100 * 1024 * 1024) { // 100MB initial limit
        setStatus('Video çok büyük. Lütfen daha küçük bir video seçin (maksimum 100MB).');
        return;
      }

      // Check video duration
      setStatus('Video süresini kontrol ediliyor...');
      try {
        const duration = await checkVideoDuration(file);
        console.log('Video duration:', duration, 'seconds');
        
        if (duration < 5) {
          setStatus('⚠️ Video çok kısa! Lütfen en az 5 saniye uzunluğunda bir video yükleyin.');
          return;
        }
          if (duration > 180) {
          setStatus('⚠️ Video çok uzun! Lütfen maksimum 180 saniye (3 dakika) uzunluğunda bir video yükleyin.');
          return;
        }
        
        setStatus(`✅ Video süresi uygun (${Math.round(duration)} saniye). İşleme başlanıyor...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Video duration check failed:', error);
        setStatus('⚠️ Video süresini kontrol edilemedi, işleme devam ediliyor...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }      let processedBlob: Blob = file;

      // iOS cihaz kontrolü
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      if (isIOSDevice) {
        // iPhone/iPad için ses kaldırma ve kompresyon atlanır
        setStatus('📱 iOS cihazı tespit edildi. Video doğrudan analiz için hazırlanıyor...');
          // iOS'ta daha büyük boyut limiti uygula (standart iOS videoları 40-50MB arası)
        if (file.size > 70 * 1024 * 1024) { // 70MB limit for iOS
          setStatus('⚠️ iOS cihazları için video boyutu 70MB\'yi geçemez. Lütfen daha kısa veya düşük kaliteli bir video seçin.');
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Diğer cihazlar için normal işlem
        // First, remove audio for better processing
        setStatus('Ses kaldırılıyor... (Video sessiz hale getiriliyor)');
        try {
          processedBlob = await removeAudio(file);
          console.log('Audio removal completed. Original size:', file.size, 'New size:', processedBlob.size);
          setStatus('✅ Ses başarıyla kaldırıldı! Video hazırlanıyor...');
          // Small delay to show success message
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('Audio removal failed:', error);
          setStatus('⚠️ Ses kaldırma başarısız oldu, orijinal video kullanılacak.');
          processedBlob = file;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Then compress if still too large
        if (processedBlob.size > 20 * 1024 * 1024) {
          setStatus('Video kompres ediliyor...');
          try {
            processedBlob = await compressVideo(processedBlob);
            console.log('Compression completed. Size:', processedBlob.size);
          } catch (error) {
            console.error('Compression failed:', error);
            // If compression fails, try to use processed blob if it's not too large
            if (processedBlob.size > 20 * 1024 * 1024) {
              setStatus('Video kompres edilemedi ve çok büyük. Lütfen daha küçük bir video yükleyin.');
              return;
            }
          }        }
      }      // Final size check - iOS için farklı limit
      const finalSizeLimit = isIOSDevice ? 70 * 1024 * 1024 : 20 * 1024 * 1024; // iOS: 70MB, Diğerleri: 20MB
      if (processedBlob.size > finalSizeLimit) {
        const limitText = isIOSDevice ? '70MB' : '20MB';
        setStatus(`İşlenmiş video hala ${limitText}'den büyük. Lütfen daha kısa bir video yükleyin.`);return;
      }      // Convert to base64
      setStatus('AI analizi için hazırlanıyor...');
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // Debug information
        console.log('FileReader result type:', typeof base64);
        console.log('FileReader result length:', base64?.length);
        console.log('FileReader result prefix:', base64?.substring(0, 50));
        console.log('Processed blob type:', processedBlob.type);
        console.log('Processed blob size:', processedBlob.size);

        // Video boyutuna göre süre tahmini göster
        const timeEstimate = getTimeEstimate(processedBlob.size);
        setStatus(`🤖 AI analizi başlıyor... 
        
📊 **Video Bilgileri:**
- Boyut: ${timeEstimate.sizeMB} MB
- Tahmini upload süresi: ${timeEstimate.uploadTime}
- Tahmini AI analiz süresi: ${timeEstimate.aiTime}
- **Toplam beklenen süre: ${timeEstimate.total}**

⏳ Lütfen bekleyin, video analiz ediliyor...`);
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye bekle ki kullanıcı tahmini okuyabilsin
        
        try {
          const aiRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoBase64: base64 }),
          });
          const aiData = await aiRes.json();

          if (!aiRes.ok) {
            setStatus('AI analizi hatası: ' + (aiData.error || 'Video analiz edilemedi'));
            return;
          }
          
          const analysisResult = aiData.message?.candidates?.[0]?.content?.parts?.[0]?.text || 
                                aiData.message?.text || 
                                'Video analiz edildi.';
          setAIresponse(analysisResult);
          setStatus('✅ analizin tamamlandı! Sonuçlar aşağıda:');
        } catch (error) {
          console.error('AI request failed:', error);
          setStatus('AI servisi ile bağlantı kurulamadı. Lütfen tekrar deneyin.');
        }
      };
      
      reader.onerror = () => {
        setStatus('Video okuma hatası. Lütfen tekrar deneyin.');
      };
      
      reader.readAsDataURL(processedBlob);

    } catch (error) {
      console.error('Video processing error:', error);
      setStatus('Video işlenirken hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const getTimeEstimate = (fileSizeBytes: number) => {
    const sizeMB = fileSizeBytes / (1024 * 1024);
    
    let uploadTime, aiTime, total;
    
    if (sizeMB <= 10) {
      uploadTime = '10-30 saniye';
      aiTime = '10-20 saniye';
      total = '~1 dakika';
    } else if (sizeMB <= 30) {
      uploadTime = '30-60 saniye';
      aiTime = '20-40 saniye';
      total = '~2 dakika';
    } else if (sizeMB <= 50) {
      uploadTime = '1-2 dakika';
      aiTime = '30-60 saniye';
      total = '~3 dakika';
    } else {
      uploadTime = '2-3 dakika';
      aiTime = '1-2 dakika';
      total = '~5 dakika';
    }
    
    return { sizeMB: sizeMB.toFixed(1), uploadTime, aiTime, total };
  };

  if (!isClient) {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4 sm:gap-6">
        <div className="w-full bg-gray-200 px-4 py-3 rounded animate-pulse">
          Yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4 sm:gap-6">
      {isIOS ? (
        // iOS Safari için ayrı butonlar
        <div className="w-full space-y-2">
          <input
            type="file"
            accept="video/*"
            capture="environment"
            className="w-full bg-blue-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded shadow cursor-pointer hover:bg-blue-600 transition-all"
            onChange={handleFileChange}
          />
          <p className="text-sm text-gray-600 text-center">
            Kamera ile çek 📸
          </p>
          <input
            type="file"
            accept="video/*"
            className="w-full bg-green-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded shadow cursor-pointer hover:bg-green-600 transition-all"
            onChange={handleFileChange}
          />
          <p className="text-sm text-gray-600 text-center">
            Galeriden Seç 📁
          </p>
        </div>
      ) : (
        // Diğer tarayıcılar için standart input
        <>
        <input
          type="file"
          accept="video/*"
          className="w-full  rounded shadow cursor-pointer border-2 p-4 transition-all"

          onChange={handleFileChange}
          id="gallery-upload"
        />
        <label className="text-sm text-gray-600" htmlFor="gallery-upload">Video seç</label>
        </>
      )}
      
      <div className="w-full transition-all bg-gray-100 p-4 rounded shadow text-black">
        <p>{status}</p>
        {AIresponse && AIresponse.length > 0 && (
          <div className="mt-4 text-gray-800 fade-in">
            <Markdown remarkPlugins={[remarkGfm]}>
              {AIresponse}
            </Markdown>
          </div>
        )}
      </div>
      
      
      <video 
        ref={videoRef} 
        style={{ display: 'none' }} 
        preload="metadata"
        playsInline
        muted
      />
    </div>
  )
}

export default UploadVideo