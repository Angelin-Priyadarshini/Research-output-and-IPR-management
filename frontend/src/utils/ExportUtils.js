import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

export const exportToPDF = (project) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 31, 103); // SSN Navy
    doc.text("SSN Research Portal", 105, 20, null, null, "center");

    doc.setFontSize(14);
    doc.setTextColor(243, 112, 33); // SSN Orange
    doc.text("Official IPR Submission Export", 105, 28, null, null, "center");

    // Line Separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);

    // Project Details
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    const splitTitle = doc.splitTextToSize(project.title, 170);
    doc.text(splitTitle, 20, 50);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Type: ${project.type} | Category: ${project.category} | Status: ${project.status}`, 20, 50 + (splitTitle.length * 7));
    doc.text(`Submitted by ID: ${project.owner_id} | Date: ${new Date(project.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 20, 57 + (splitTitle.length * 7));

    // Content Block
    let currentY = 70 + (splitTitle.length * 7);

    doc.setFontSize(12);
    doc.setTextColor(0, 31, 103);
    doc.text("Executive Summary / Abstract", 20, currentY);

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const splitAbstract = doc.splitTextToSize(project.abstract || "No abstract provided.", 170);
    doc.text(splitAbstract, 20, currentY + 10);

    // Dynamic Fields Table based on type
    currentY += 20 + (splitAbstract.length * 5);

    let tableData = [];
    if (project.type === 'Patent') {
        tableData = [
            ["Patent / App. Number", project.patent_no || "N/A"],
            ["Inventors", project.inventors || "N/A"],
            ["Date Filed", project.date_filed || "N/A"],
            ["Date Published", project.date_published || "N/A"],
            ["Date Granted", project.date_granted || "N/A"],
            ["Proof Link", project.proof_link || "N/A"]
        ];
    } else if (project.type === 'Publication') {
        tableData = [
            ["Journal", project.journal || "N/A"],
            ["Year", (project.year || "N/A").toString()],
            ["Paper Link", project.paper_link || "N/A"]
        ];
    }

    if (tableData.length > 0) {
        doc.autoTable({
            startY: currentY,
            head: [['Metadata Field', 'Value']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [0, 31, 103] },
            margin: { left: 20, right: 20 }
        });
        currentY = doc.lastAutoTable.finalY + 15;
    }

    // Mentor Notes
    if (project.professor_comments) {
        doc.setFontSize(12);
        doc.setTextColor(243, 112, 33);
        doc.text("Mentor Endorsement / Notes", 20, currentY);

        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        const splitNotes = doc.splitTextToSize(project.professor_comments, 170);
        doc.text(splitNotes, 20, currentY + 10);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 105, 290, null, null, "center");

    doc.save(`${project.title.substring(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.pdf`);
};

export const exportToWord = async (project) => {
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        text: "SSN Research Portal",
                        heading: HeadingLevel.TITLE,
                        alignment: "center",
                    }),
                    new Paragraph({
                        text: "Official IPR Submission Export",
                        heading: HeadingLevel.HEADING_2,
                        alignment: "center",
                    }),
                    new Paragraph({ text: "" }), // Spacing
                    new Paragraph({
                        children: [
                            new TextRun({ text: project.title, bold: true, size: 28 }),
                        ],
                    }),
                    new Paragraph({
                        text: `Type: ${project.type} | Category: ${project.category} | Status: ${project.status}`,
                    }),
                    new Paragraph({
                        text: `Date: ${new Date(project.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
                    }),
                    new Paragraph({ text: "" }), // Spacing
                    new Paragraph({
                        text: "Executive Summary / Abstract",
                        heading: HeadingLevel.HEADING_3,
                    }),
                    new Paragraph({
                        text: project.abstract || "No abstract provided.",
                    }),
                    new Paragraph({ text: "" }), // Spacing
                    ...(project.professor_comments ? [
                        new Paragraph({
                            text: "Mentor Notes",
                            heading: HeadingLevel.HEADING_3,
                        }),
                        new Paragraph({
                            text: project.professor_comments,
                        })
                    ] : [])
                ],
            },
        ],
    });

    try {
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${project.title.substring(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.docx`);
    } catch (e) {
        console.error("Error generating Word doc:", e);
        alert("Failed to export Word document.");
    }
};
