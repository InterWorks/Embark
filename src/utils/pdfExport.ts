import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Client, Tag } from '../types';

// Extend jsPDF type to include lastAutoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

export function exportClientToPDF(client: Client, tags?: Tag[]): void {
  const doc = new jsPDF();
  const tagLookup = new Map(tags?.map((t) => [t.id, t.name]) || []);
  let yPos = 20;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(79, 70, 229); // Purple color
  doc.text('Client Report', 20, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos);

  // Client Name
  yPos += 15;
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(client.name, 20, yPos);

  // Status badge
  yPos += 8;
  doc.setFontSize(10);
  const statusColors: Record<string, [number, number, number]> = {
    active: [16, 185, 129],
    completed: [59, 130, 246],
    'on-hold': [245, 158, 11],
  };
  const statusColor = statusColors[client.status] || [128, 128, 128];
  doc.setTextColor(...statusColor);
  doc.text(`Status: ${client.status.toUpperCase()}`, 20, yPos);

  if (client.priority && client.priority !== 'none') {
    doc.text(`  |  Priority: ${client.priority.toUpperCase()}`, 70, yPos);
  }

  // Contact Information
  yPos += 15;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Contact Information', 20, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(64, 64, 64);
  doc.text(`Email: ${client.email}`, 20, yPos);
  yPos += 6;
  doc.text(`Phone: ${client.phone || 'Not provided'}`, 20, yPos);
  yPos += 6;
  doc.text(`Assigned To: ${client.assignedTo}`, 20, yPos);
  yPos += 6;
  doc.text(`Created: ${new Date(client.createdAt).toLocaleDateString()}`, 20, yPos);

  // Tags
  if (client.tags && client.tags.length > 0) {
    yPos += 6;
    const tagNames = client.tags.map((id) => tagLookup.get(id) || id).join(', ');
    doc.text(`Tags: ${tagNames}`, 20, yPos);
  }

  // Services
  if (client.services.length > 0) {
    yPos += 15;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Services', 20, yPos);

    yPos += 5;
    autoTable(doc, {
      startY: yPos,
      head: [['Service Name']],
      body: client.services.map((s) => [s.name]),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 20, right: 20 },
    });
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Milestones
  if (client.milestones && client.milestones.length > 0) {
    // Check if we need a new page
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Milestones', 20, yPos);

    const completedMilestones = client.milestones.filter((m) => m.completedAt).length;
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `(${completedMilestones}/${client.milestones.length} completed)`,
      50,
      yPos
    );

    yPos += 5;
    autoTable(doc, {
      startY: yPos,
      head: [['Milestone', 'Target Date', 'Status']],
      body: client.milestones
        .sort((a, b) => a.order - b.order)
        .map((m) => [
          m.title,
          m.targetDate ? new Date(m.targetDate).toLocaleDateString() : '-',
          m.completedAt ? `Completed ${new Date(m.completedAt).toLocaleDateString()}` : 'Pending',
        ]),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 20, right: 20 },
    });
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Checklist
  if (client.checklist.length > 0) {
    // Check if we need a new page
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Checklist', 20, yPos);

    const completedTasks = client.checklist.filter((t) => t.completed).length;
    const progress = Math.round((completedTasks / client.checklist.length) * 100);
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `(${completedTasks}/${client.checklist.length} completed - ${progress}%)`,
      45,
      yPos
    );

    yPos += 5;
    autoTable(doc, {
      startY: yPos,
      head: [['Task', 'Status', 'Due Date']],
      body: client.checklist.map((task) => [
        task.title,
        task.completed ? 'Completed' : 'Pending',
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 20, right: 20 },
      didParseCell: (data) => {
        // Style completed tasks
        if (data.column.index === 1 && data.cell.raw === 'Completed') {
          data.cell.styles.textColor = [16, 185, 129];
        }
      },
    });
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Communication Log
  if (client.communicationLog && client.communicationLog.length > 0) {
    // Check if we need a new page
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Communication Log', 20, yPos);

    yPos += 5;
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Type', 'Subject']],
      body: client.communicationLog
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10) // Limit to last 10 entries
        .map((entry) => [
          new Date(entry.timestamp).toLocaleDateString(),
          entry.type.charAt(0).toUpperCase() + entry.type.slice(1),
          entry.subject,
        ]),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 20, right: 20 },
    });
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Notes
  if (client.notes && client.notes.trim()) {
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Notes', 20, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(64, 64, 64);

    // Split notes into lines that fit the page width
    const splitNotes = doc.splitTextToSize(client.notes, 170);
    doc.text(splitNotes, 20, yPos);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      'Generated by Embark - Client Onboarding Tracker',
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 5,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`${client.name.replace(/[^a-zA-Z0-9]/g, '-')}-report.pdf`);
}

export function exportClientsToPDF(clients: Client[], tags?: Tag[]): void {
  const doc = new jsPDF();
  const tagLookup = new Map(tags?.map((t) => [t.id, t.name]) || []);
  let yPos = 20;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(79, 70, 229);
  doc.text('Clients Report', 20, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos);
  doc.text(`Total Clients: ${clients.length}`, 120, yPos);

  // Summary stats
  yPos += 15;
  const activeCount = clients.filter((c) => c.status === 'active').length;
  const completedCount = clients.filter((c) => c.status === 'completed').length;
  const onHoldCount = clients.filter((c) => c.status === 'on-hold').length;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary', 20, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129);
  doc.text(`Active: ${activeCount}`, 20, yPos);
  doc.setTextColor(59, 130, 246);
  doc.text(`Completed: ${completedCount}`, 60, yPos);
  doc.setTextColor(245, 158, 11);
  doc.text(`On Hold: ${onHoldCount}`, 110, yPos);

  // Client list table
  yPos += 15;
  autoTable(doc, {
    startY: yPos,
    head: [['Name', 'Email', 'Assigned To', 'Status', 'Progress', 'Tags']],
    body: clients.map((client) => {
      const completedTasks = client.checklist.filter((t) => t.completed).length;
      const totalTasks = client.checklist.length;
      const progress = totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '-';
      const clientTags = (client.tags || [])
        .map((id) => tagLookup.get(id) || id)
        .slice(0, 2)
        .join(', ');

      return [
        client.name,
        client.email,
        client.assignedTo,
        client.status,
        progress,
        clientTags,
      ];
    }),
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 45 },
      2: { cellWidth: 30 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 30 },
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      'Generated by Embark - Client Onboarding Tracker',
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 5,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`clients-report-${new Date().toISOString().split('T')[0]}.pdf`);
}
