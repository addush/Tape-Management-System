import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export default function SignaturePadComponent({ onFileChange }) {
  const sigCanvasRef = useRef(null);

  // Convert DataURL to Blob
  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  const clear = () => sigCanvasRef.current.clear();

  const save = () => {
    if (sigCanvasRef.current.isEmpty()) {
      alert('Please provide a signature before saving.');
      return;
    }
    const dataUrl = sigCanvasRef.current.toDataURL();
    const blob = dataURLtoBlob(dataUrl);
    onFileChange(blob);
  };

  return (
    <div>
      <SignatureCanvas
        ref={sigCanvasRef}
        penColor="black"
        canvasProps={{ width: 400, height: 150, style: { border: '1px solid #ddd' } }}
      />
      <div style={{ marginTop: 8 }}>
        <button type="button" onClick={clear}>Clear</button>
        <button type="button" onClick={save} style={{ marginLeft: 8 }}>Save Signature</button>
      </div>
    </div>
  );
}
