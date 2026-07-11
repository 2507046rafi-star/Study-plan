import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import pptxgen from "pptxgenjs";
import { CardData, CardTheme } from "../types";

/**
 * Export Goal Card as Image (PNG)
 */
export async function exportToImage(elementId: string, filename: string): Promise<void> {
  const container = document.getElementById(elementId);
  if (!container) {
    throw new Error("Target card container element not found");
  }

  // Hide action buttons or interactive states if needed before snapshot
  const dataUrl = await toPng(container, {
    cacheBust: true,
    quality: 0.98,
    backgroundColor: "#ffffff",
    style: {
      transform: "scale(1)",
      borderRadius: "0", // Temporarily remove border radius for clean capture if desired, or keep it
    },
  });

  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = dataUrl;
  link.click();
}

/**
 * Export Goal Card as PDF
 */
export async function exportToPDF(elementId: string, filename: string): Promise<void> {
  const container = document.getElementById(elementId);
  if (!container) {
    throw new Error("Target card container element not found");
  }

  // Get high quality PNG of the card
  const dataUrl = await toPng(container, {
    cacheBust: true,
    quality: 1.0,
    backgroundColor: "#ffffff",
  });

  // Create PDF
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm

  // Load image properties to maintain aspect ratio
  const tempImg = new Image();
  tempImg.src = dataUrl;

  await new Promise<void>((resolve) => {
    tempImg.onload = () => {
      const imgWidth = pageWidth - 20; // 10mm margins on both sides
      const imgHeight = (tempImg.height * imgWidth) / tempImg.width;

      // Center the card vertically on the PDF page
      const yOffset = Math.max(10, (pageHeight - imgHeight) / 2);

      pdf.setFillColor(244, 244, 245); // Soft zinc background
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      pdf.addImage(dataUrl, "PNG", 10, yOffset, imgWidth, imgHeight);
      pdf.save(`${filename}.pdf`);
      resolve();
    };
  });
}

/**
 * Export Goal Card as PowerPoint (PPTX)
 */
export async function exportToPowerPoint(data: CardData, activeTheme: CardTheme, filename: string): Promise<void> {
  const pptx = new pptxgen();

  // Create slide
  const slide = pptx.addSlide();

  // Set background color based on theme
  // We can strip hex if needed or use presets.
  let slideBgColor = "F8FAF8"; // default light moss/nordic
  if (activeTheme.id === "nordic-slate") slideBgColor = "F1F5F9";
  if (activeTheme.id === "sunset-glow") slideBgColor = "FFFBEB";
  if (activeTheme.id === "midnight-cyber") slideBgColor = "09090B";
  if (activeTheme.id === "forest-sanctuary") slideBgColor = "F0F4F1";
  if (activeTheme.id === "royal-gold") slideBgColor = "022C22";
  if (activeTheme.id === "solar-minimalist") slideBgColor = "FFFFFF";

  slide.background = { color: slideBgColor };

  // Set text/title color for slides
  const darkText = activeTheme.id === "midnight-cyber" || activeTheme.id === "royal-gold" ? "FFFFFF" : "1E293B";
  const accentText = activeTheme.id === "midnight-cyber" ? "E24A8D" : "16A34A";

  // Card Header / Slide Title
  slide.addText(data.title || "DAILY GOAL CARD", {
    x: 0.5,
    y: 0.5,
    w: 6.0,
    h: 0.6,
    fontSize: 26,
    bold: true,
    color: darkText,
    fontFace: activeTheme.id.includes("serif") ? "Georgia" : "Arial",
  });

  // Date and User
  const dateUserText = `${data.date} ${data.userName ? `| By ${data.userName}` : ""}`;
  slide.addText(dateUserText, {
    x: 0.5,
    y: 1.1,
    w: 6.0,
    h: 0.4,
    fontSize: 12,
    color: activeTheme.id === "midnight-cyber" ? "22D3EE" : "64748B",
  });

  // Subtitle
  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 0.5,
      y: 1.5,
      w: 6.0,
      h: 0.4,
      fontSize: 10,
      italic: true,
      color: "888888",
    });
  }

  // Left Section - Goals List (or full width if no images)
  const hasImages = data.images.length > 0;
  const leftColWidth = hasImages ? 5.5 : 9.0;

  slide.addText("Objectives:", {
    x: 0.5,
    y: 2.1,
    w: leftColWidth,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: darkText,
  });

  // Render goals as slide list
  if (data.goals.length === 0) {
    slide.addText("No goals specified for today.", {
      x: 0.5,
      y: 2.6,
      w: leftColWidth,
      h: 0.5,
      fontSize: 11,
      color: "888888",
    });
  } else {
    data.goals.forEach((goal, idx) => {
      const yPos = 2.6 + idx * 0.8;
      if (yPos < 6.8) {
        // Only draw up to slide limit
        const statusMarker = goal.completed ? "[X]" : "[  ]";
        const goalText = `${statusMarker} ${goal.title} (${goal.priority.toUpperCase()})`;

        // Objective text
        slide.addText(goalText, {
          x: 0.5,
          y: yPos,
          w: leftColWidth,
          h: 0.35,
          fontSize: 11,
          bold: true,
          color: goal.completed ? "888888" : darkText,
        });

        // Description text
        if (goal.description) {
          slide.addText(goal.description, {
            x: 0.7,
            y: yPos + 0.35,
            w: leftColWidth - 0.2,
            h: 0.35,
            fontSize: 9.5,
            color: "666666",
          });
        }
      }
    });
  }

  // Right Section - Images (if any)
  if (hasImages) {
    slide.addText("Visual Inspiration:", {
      x: 6.5,
      y: 2.1,
      w: 3.0,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: darkText,
    });

    const imgToRender = data.images[0];
    try {
      slide.addImage({
        data: imgToRender.url, // Expecting base64 URL or standard URL
        x: 6.5,
        y: 2.6,
        w: 3.0,
        h: 2.2,
      });

      if (imgToRender.caption) {
        slide.addText(`"${imgToRender.caption}"`, {
          x: 6.5,
          y: 4.9,
          w: 3.0,
          h: 0.8,
          fontSize: 9,
          italic: true,
          color: "666666",
        });
      }
    } catch (e) {
      console.error("Failed to render image in PowerPoint export", e);
    }
  }

  // Progress at bottom
  const completedCount = data.goals.filter((g) => g.completed).length;
  const totalCount = data.goals.length;
  if (totalCount > 0) {
    const progressText = `Completion Rate: ${completedCount}/${totalCount} Goals (${Math.round(
      (completedCount / totalCount) * 100
    )}%)`;
    slide.addText(progressText, {
      x: 0.5,
      y: 6.9,
      w: 5.0,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: accentText,
    });
  }

  // Quote at bottom center
  if (data.footerQuote) {
    slide.addText(`"${data.footerQuote}"`, {
      x: 0.5,
      y: 7.2,
      w: 9.0,
      h: 0.3,
      fontSize: 9,
      italic: true,
      align: "center",
      color: "888888",
    });
  }

  pptx.writeFile({ fileName: `${filename}.pptx` });
}

/**
 * Export Goal Card as Word compatible Document (.doc / .docx layout wrapper)
 */
export function exportToWordDocument(data: CardData, filename: string): void {
  // Generate Microsoft Word friendly Rich HTML structure with embedded CSS
  const completedCount = data.goals.filter((g) => g.completed).length;
  const totalCount = data.goals.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const htmlString = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <meta charset="utf-8">
      <title>${data.title || "Daily Goal Card"}</title>
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #334155;
          margin: 40px;
          line-height: 1.5;
        }
        h1 {
          font-family: 'Georgia', serif;
          color: #0f172a;
          font-size: 28pt;
          margin-bottom: 5px;
          font-weight: bold;
        }
        .subtitle {
          color: #64748b;
          font-size: 11pt;
          font-style: italic;
          margin-bottom: 20px;
        }
        .metadata-table {
          width: 100%;
          border-bottom: 1px solid #cbd5e1;
          margin-bottom: 30px;
          padding-bottom: 10px;
        }
        .section-title {
          font-family: 'Georgia', serif;
          font-size: 16pt;
          color: #1e293b;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 6px;
          margin-top: 30px;
          margin-bottom: 15px;
        }
        .goal-item {
          background-color: #f8fafc;
          border-left: 4px solid #94a3b8;
          padding: 12px 15px;
          margin-bottom: 12px;
          border-radius: 4px;
        }
        .goal-high { border-left-color: #f43f5e; }
        .goal-medium { border-left-color: #f59e0b; }
        .goal-low { border-left-color: #10b981; }
        .goal-completed {
          background-color: #f1f5f9;
          text-decoration: line-through;
          color: #94a3b8;
          border-left-color: #cbd5e1;
        }
        .image-container {
          margin-top: 20px;
          margin-bottom: 20px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 10px;
          border-radius: 8px;
          display: inline-block;
        }
        .image-caption {
          font-style: italic;
          color: #475569;
          font-size: 9.5pt;
          margin-top: 8px;
          text-align: center;
        }
        .progress-box {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          padding: 15px;
          border-radius: 6px;
          margin-top: 30px;
        }
        .footer-quote {
          margin-top: 50px;
          text-align: center;
          font-style: italic;
          color: #94a3b8;
          border-top: 1px solid #f1f5f9;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <h1>${data.title || "Daily Goal Card"}</h1>
      <div class="subtitle">${data.subtitle || "Personal Productivity Planner"}</div>
      
      <table class="metadata-table">
        <tr>
          <td style="font-size: 10pt; color: #64748b;">
            <strong>Date:</strong> ${data.date}
          </td>
          <td style="font-size: 10pt; color: #64748b; text-align: right;">
            <strong>Prepared by:</strong> ${data.userName || "Guest Organizer"}
          </td>
        </tr>
      </table>

      <div class="section-title">Today's Objectives</div>
      ${
        data.goals.length === 0
          ? "<p style='color: #94a3b8;'>No goals defined for today.</p>"
          : data.goals
              .map(
                (g) => `
        <div class="goal-item ${g.completed ? "goal-completed" : ""} goal-${g.priority}">
          <table style="width: 100%;">
            <tr>
              <td>
                <span style="font-size: 12pt; font-weight: bold;">
                  ${g.completed ? "[✓]" : "[ ]"} ${g.title}
                </span>
                ${g.description ? `<p style="margin: 4px 0 0 0; font-size: 9.5pt; color: #64748b;">${g.description}</p>` : ""}
              </td>
              <td style="text-align: right; width: 120px;">
                <span style="font-size: 8pt; font-weight: bold; background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; color: #475569;">
                  ${g.priority.toUpperCase()} PRIORITY
                </span>
              </td>
            </tr>
          </table>
        </div>
      `
              )
              .join("")
      }

      ${
        data.images.length > 0
          ? `
        <div class="section-title">Visual Context & Inspiration</div>
        ${data.images
          .map(
            (img) => `
          <div class="image-container">
            <img src="${img.url}" width="420" alt="${img.name}" />
            ${img.caption ? `<div class="image-caption">"${img.caption}"</div>` : ""}
          </div>
        `
          )
          .join("")}
      `
          : ""
      }

      <div class="progress-box">
        <strong>Daily Performance Progress:</strong> ${completedCount} out of ${totalCount} goals achieved (${progressPercent}%)
      </div>

      ${
        data.footerQuote
          ? `
        <div class="footer-quote">
          "${data.footerQuote}"
        </div>
      `
          : ""
      }
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff" + htmlString], {
    type: "application/msword;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
