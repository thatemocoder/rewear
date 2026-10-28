/** Hands the viewer a file to save. Nothing leaves the browser. */
export function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
