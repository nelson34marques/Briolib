let pdfjsPromise;

export function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjsLib, pdfWorker]) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker.default;
      return pdfjsLib;
    });
  }
  return pdfjsPromise;
}

const MAX_CACHED_DOCUMENTS = 2;
const documentCache = new Map();

export async function loadDocument(id, file) {
  const cached = documentCache.get(id);
  if (cached) {
    documentCache.delete(id);
    documentCache.set(id, cached);
    return cached;
  }

  const pdfjsLib = await loadPdfJs();
  const data = await file.arrayBuffer();
  const document_ = await pdfjsLib.getDocument({ data }).promise;

  documentCache.set(id, document_);
  while (documentCache.size > MAX_CACHED_DOCUMENTS) {
    const [oldestId, oldestDocument] = documentCache.entries().next().value;
    documentCache.delete(oldestId);
    oldestDocument.destroy().catch(() => {});
  }

  return document_;
}

export function forgetDocument(id) {
  const document_ = documentCache.get(id);
  if (!document_) return;
  documentCache.delete(id);
  document_.destroy().catch(() => {});
}

export async function renderThumbnail(document_) {
  const pdfPage = await document_.getPage(1);
  const baseViewport = pdfPage.getViewport({ scale: 1 });
  const scale = Math.min(0.6, 360 / baseViewport.width);
  const viewport = pdfPage.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await pdfPage.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

  return canvas.toDataURL('image/jpeg', 0.72);
}
