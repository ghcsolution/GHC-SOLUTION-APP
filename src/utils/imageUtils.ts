
/**
 * Utility to open a base64 image in a new browser tab.
 * This bypasses browser security restrictions that block direct window.open(dataUrl).
 */
export const openBase64InNewTab = (base64Data: string) => {
  try {
    // Check if it's a data URL
    if (!base64Data.startsWith('data:')) {
      window.open(base64Data, '_blank');
      return;
    }

    const parts = base64Data.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const b64 = parts[1];
    
    const byteCharacters = atob(b64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: mime });
    const url = URL.createObjectURL(blob);
    
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
      // Optional: Clean up the object URL after some time
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } else {
      alert('O bloqueador de pop-ups impediu a abertura da imagem. Por favor, permita pop-ups para este site.');
    }
  } catch (error) {
    console.error('Erro ao abrir imagem em nova aba:', error);
    // Fallback to direct open if blob fails
    window.open(base64Data, '_blank');
  }
};
