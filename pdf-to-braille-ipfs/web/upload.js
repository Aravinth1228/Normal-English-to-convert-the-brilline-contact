const form = document.getElementById('uploadForm');
const result = document.getElementById('result');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  result.classList.remove('hidden');
  result.innerHTML = 'Uploading and converting…';

  const fd = new FormData(form);
  try {
    const res = await fetch('/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Failed');

    const gateway = (cid) => `https://gateway.pinata.cloud/ipfs/${cid}`;

    result.innerHTML = `
      <h3>Done 🎉</h3>
      <div class="links">
        <a target="_blank" href="${gateway(data.files.pdf)}">Original PDF (IPFS)</a>
        <a target="_blank" href="${gateway(data.files.brailleTxt)}">Braille Text .txt (IPFS)</a>
        <a target="_blank" href="${gateway(data.files.brailleBrf)}">Braille .brf (IPFS)</a>
        <a target="_blank" href="${gateway(data.manifestCID)}">Manifest JSON (IPFS)</a>
      </div>
      <pre class="code">${JSON.stringify(data, null, 2)}</pre>
    `;
  } catch (err) {
    result.innerHTML = `<span style="color:#fca5a5">Error: ${err.message}</span>`;
  }
});
