import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";

export async function generateDocx(content: { title: string; body: string; subtitle?: string }) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: content.title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          ...(content.subtitle
            ? [
                new Paragraph({
                  text: content.subtitle,
                  heading: HeadingLevel.HEADING_2,
                  alignment: AlignmentType.CENTER,
                }),
              ]
            : []),
          new Paragraph({
            children: [new TextRun({ text: content.body, break: 1 })],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${content.title.replace(/\s+/g, "_")}.docx`);
}

export function generatePdf(content: { title: string; body: string; subtitle?: string }) {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(22);
  doc.text(content.title, pageWidth / 2, 20, { align: "center" });
  
  if (content.subtitle) {
    doc.setFontSize(16);
    doc.text(content.subtitle, pageWidth / 2, 30, { align: "center" });
  }
  
  doc.setFontSize(12);
  const splitText = doc.splitTextToSize(content.body, pageWidth - margin * 2);
  doc.text(splitText, margin, content.subtitle ? 45 : 35);
  
  doc.save(`${content.title.replace(/\s+/g, "_")}.pdf`);
}
