# EX374 Study Guide & Quiz

> **This is NOT an official Red Hat project.**
> I am a Red Hat employee, but this project is entirely personal and unofficial. Red Hat has not endorsed, sponsored, reviewed, or contributed to it in any way. No actual exam content was used — all material is based on publicly available documentation, the [official exam objectives](https://www.redhat.com/en/services/training/red-hat-certified-specialist-developing-automation-ansible-automation-platform-exam?section=objectives), and community resources. This project was created with AI as a personal study aid and is shared as-is.

Study material and an interactive browser-based quiz for the **Red Hat Certified Specialist in Developing Automation with Ansible Automation Platform (EX374)** exam.

**[Play the quiz](https://tll3r.github.io/ex374-study-guide/)**

## What's included

- **EX374-study-guide.md** — Practical examples for every exam objective, environment setup checklist, survival commands, and exam tips.
- **ex374-quiz.html** — A single-file, zero-dependency quiz game playable in any browser. Multiple choice, type-the-command, and flashcard modes with ~75 questions across all objective areas.
- **role-pdf-saver.js** — Browser console script that auto-saves every page of a Red Hat ROLE course as a PDF. Paste it once, click through the pages, and each one downloads automatically. See [usage instructions](#saving-role-course-pages-as-pdf) below.

## Recommended training

This project is not a substitute for proper training. If you are serious about passing the exam, I strongly recommend taking the official [AU374 — Developing Advanced Automation with Red Hat Ansible Automation Platform](https://www.redhat.com/en/services/training/au374-developing-advanced-automation-red-hat-ansible-automation-platform) course from Red Hat. It covers all objectives in depth with hands-on labs on a real AAP environment.

## Saving ROLE course pages as PDF

The `role-pdf-saver.js` script lets you save every page of a Red Hat ROLE course as a PDF while you navigate through it. It runs entirely in the browser — no dependencies to install.

### How to use

1. Open any course page on [role.rhu.redhat.com](https://role.rhu.redhat.com)
2. Open DevTools (**F12**) → **Console** tab
3. Paste the contents of `role-pdf-saver.js` and press **Enter**
4. The current page saves immediately as a PDF
5. Click **Next** — the new page auto-saves after 2 seconds
6. Repeat until you've gone through the whole course
7. Type `stopPDF()` in the console to stop

PDFs are named after the page ID (e.g. `ch01s01.pdf`, `ch09s02.pdf`) and download to your browser's default download folder.

### Requirements

- A valid Red Hat Learning Subscription with access to the course
- A modern browser (Chrome, Firefox, Edge)
- That's it — the script loads [html2canvas](https://html2canvas.hertzen.com/) and [jsPDF](https://github.com/parallax/jsPDF) from CDN automatically

## Did it work?

You can verify my certification status here: [Red Hat Certification ID 250-146-230](https://rhtapps.redhat.com/verify?certId=250-146-230)

## Contributing

Feel free to open issues or PRs if you spot errors or want to add questions.
