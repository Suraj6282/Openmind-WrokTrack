import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const generatePDF = (data, filename = 'document') => {
  const doc = new jsPDF();
  
  // Add company logo/header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('OpenMind WorkTrack', 14, 25);
  
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 35);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  let yPos = 50;
  
  // Add title
  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.text(data.title || 'Report', 14, yPos);
  yPos += 10;
  
  // Add employee details if present
  if (data.employee) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Employee: ${data.employee.name}`, 14, yPos);
    doc.text(`ID: ${data.employee.employeeId}`, 14, yPos + 5);
    doc.text(`Department: ${data.employee.department}`, 14, yPos + 10);
    yPos += 20;
  }
  
  // Add summary section
  if (data.summary) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary', 14, yPos);
    yPos += 7;
    
    const summaryData = data.summary.map(item => [item.label, item.value]);
    doc.autoTable({
      startY: yPos,
      head: [['Item', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
  }
  
  // Add table data
  if (data.table) {
    doc.text('Details', 14, yPos);
    yPos += 7;
    
    doc.autoTable({
      startY: yPos,
      head: [data.table.headers],
      body: data.table.rows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
  }
  
  // Add signature section for salary slips
  if (data.signatures) {
    doc.setFontSize(12);
    doc.text('Digital Signatures', 14, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.text(`Employee Signature: ${data.signatures.employee ? 'Signed' : 'Pending'}`, 14, yPos);
    doc.text(`Admin Signature: ${data.signatures.admin ? 'Signed' : 'Pending'}`, 14, yPos + 5);
    doc.text(`Signed Date: ${data.signatures.date ? format(new Date(data.signatures.date), 'MMM dd, yyyy') : 'N/A'}`, 14, yPos + 10);
    
    // Add watermark if both signatures present
    if (data.signatures.employee && data.signatures.admin) {
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(40);
      doc.text('DIGITALLY SIGNED', 40, 150, { angle: 45 });
    }
  }
  
  // Add footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `This is a system generated document. Valid only with digital signatures.`,
    14,
    doc.internal.pageSize.height - 10
  );
  
  // Save the PDF
  doc.save(`${filename}.pdf`);
};

export const generateSalarySlipPDF = (salarySlip) => {
  const data = {
    title: `Salary Slip - ${salarySlip.month} ${salarySlip.year}`,
    employee: salarySlip.employee,
    summary: [
      ['Basic Salary', `₹${salarySlip.basicSalary}`],
      ['Working Days', salarySlip.workingDays],
      ['Present Days', salarySlip.presentDays],
      ['Leaves', salarySlip.leaves],
      ['Overtime', `${salarySlip.overtime.hours}h`],
      ['Gross Pay', `₹${salarySlip.grossPay}`],
      ['Deductions', `₹${salarySlip.deductions.total}`],
      ['Net Payable', `₹${salarySlip.netPayable}`]
    ],
    table: {
      headers: ['Description', 'Earnings', 'Deductions'],
      rows: [
        ['Basic Salary', `₹${salarySlip.basicSalary}`, '-'],
        ['HRA', `₹${salarySlip.allowances.hra}`, '-'],
        ['Conveyance', `₹${salarySlip.allowances.conveyance}`, '-'],
        ['Medical', `₹${salarySlip.allowances.medical}`, '-'],
        ['Overtime', `₹${salarySlip.overtime.amount}`, '-'],
        ['Late Penalty', '-', `₹${salarySlip.deductions.latePenalty}`],
        ['Half Day Penalty', '-', `₹${salarySlip.deductions.halfDayPenalty}`],
        ['Unpaid Leave', '-', `₹${salarySlip.leaves.unpaid * salarySlip.perDaySalary}`]
      ]
    },
    signatures: salarySlip.signatures
  };
  
  generatePDF(data, `salary-slip-${salarySlip.employee.employeeId}-${salarySlip.month}-${salarySlip.year}`);
};