// ============================================================
//  ROLE Course Auto-PDF Saver
//
//  Generates a PDF of every page on Red Hat's ROLE learning
//  platform as you navigate through the course.
//
//  Usage:
//    1. Open any course page on role.rhu.redhat.com
//    2. Open DevTools (F12) → Console
//    3. Paste this entire script and press Enter
//    4. The current page is saved immediately
//    5. Click "Next" — the new page auto-saves after 2 seconds
//    6. Type stopPDF() in the console to stop
//
//  PDFs are named after the page ID (e.g. ch01s01.pdf) and
//  download to your browser's default download folder.
//
//  Dependencies (loaded automatically from CDN):
//    - html2canvas 1.4.1
//    - jsPDF 2.5.1
// ============================================================

(async () => {
  const load = url => new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = url; s.onload = ok; s.onerror = fail;
    document.head.appendChild(s);
  });
  await load('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  await load('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

  let lastUrl = '', busy = false;

  async function save() {
    if (busy) return;
    busy = true;
    const id = location.pathname.split('/').pop() || 'page';
    console.log('Saving ' + id + '.pdf ...');
    try {
      const el = document.querySelector('article')
        || document.querySelector('main')
        || document.querySelector('[role="main"]')
        || document.body;

      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 500));

      const canvas = await html2canvas(el, {
        scale: 1.5,
        scrollY: -window.scrollY,
        useCORS: true,
        windowHeight: el.scrollHeight,
      });

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pw = 190, ph = 277;
      const imgH = (canvas.height * pw) / canvas.width;
      let y = 0;

      while (y < imgH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 0.92),
          'JPEG', 10, 10 - y, pw, imgH
        );
        y += ph;
      }

      pdf.save(id + '.pdf');
      console.log(id + '.pdf saved!');
    } catch (e) {
      console.error('Failed: ' + e.message);
    }
    busy = false;
  }

  const watcher = setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(save, 2000);
    }
  }, 1000);

  window.stopPDF = () => { clearInterval(watcher); console.log('Stopped.'); };

  lastUrl = location.href;
  setTimeout(save, 1000);
  console.log('Auto-PDF active. Navigate pages — PDFs download automatically. Type stopPDF() to stop.');
})();
