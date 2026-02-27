const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create PDF document
const createPDF = (options = {}) => {
  return new PDFDocument({
    size: 'A4',
    margin: 50,
    ...options
  });
};

// Generate salary slip PDF
exports.generateSalarySlipPDF = async (payroll, employee, company) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = createPDF();
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc
        .fillColor('#2563eb')
        .fontSize(20)
        .text('OpenMind WorkTrack', { align: 'center' })
        .fontSize(12)
        .fillColor('#000000')
        .text('Salary Slip', { align: 'center' })
        .moveDown();

      // Company details
      doc
        .fontSize(10)
        .text(company.companyName, { align: 'center' })
        .text(company.companyAddress, { align: 'center' })
        .text(`Email: ${company.companyEmail} | Phone: ${company.companyPhone}`, { align: 'center' })
        .moveDown();

      // Employee details
      doc
        .fontSize(11)
        .text(`Employee Name: ${employee.name}`)
        .text(`Employee ID: ${employee.employeeId}`)
        .text(`Department: ${employee.department?.name || 'N/A'}`)
        .text(`Designation: ${employee.position || 'Employee'}`)
        .text(`Period: ${payroll.month} ${payroll.year}`)
        .moveDown();

      // Earnings table
      doc
        .fontSize(12)
        .fillColor('#2563eb')
        .text('Earnings', { underline: true })
        .fillColor('#000000')
        .fontSize(10);

      let y = doc.y;
      const tableTop = y + 10;
      const itemX = 50;
      const amountX = 300;

      doc
        .text('Description', itemX, tableTop)
        .text('Amount (₹)', amountX, tableTop);

      let rowY = tableTop + 20;
      
      // Earnings items
      const earnings = [
        { label: 'Basic Salary', amount: payroll.basicSalary },
        { label: 'House Rent Allowance', amount: payroll.allowances?.hra || 0 },
        { label: 'Conveyance Allowance', amount: payroll.allowances?.conveyance || 0 },
        { label: 'Medical Allowance', amount: payroll.allowances?.medical || 0 },
        { label: 'Special Allowance', amount: payroll.allowances?.special || 0 },
        { label: 'Overtime', amount: payroll.overtime?.amount || 0 }
      ];

      earnings.forEach(item => {
        doc
          .text(item.label, itemX, rowY)
          .text(item.amount.toLocaleString('en-IN'), amountX, rowY);
        rowY += 15;
      });

      // Total earnings
      const totalEarnings = earnings.reduce((sum, item) => sum + item.amount, 0);
      doc
        .fontSize(11)
        .fillColor('#2563eb')
        .text('Total Earnings', itemX, rowY + 5)
        .text(totalEarnings.toLocaleString('en-IN'), amountX, rowY + 5);

      // Deductions section
      doc
        .fontSize(12)
        .fillColor('#2563eb')
        .text('Deductions', 350, tableTop, { underline: true })
        .fillColor('#000000')
        .fontSize(10);

      const deductions = [
        { label: 'Late Penalty', amount: payroll.deductions?.latePenalty || 0 },
        { label: 'Half Day Penalty', amount: payroll.deductions?.halfDayPenalty || 0 },
        { label: 'Unpaid Leave', amount: payroll.leaves?.unpaid * payroll.perDaySalary || 0 },
        { label: 'Other Deductions', amount: payroll.deductions?.otherDeductions || 0 }
      ];

      rowY = tableTop + 20;
      deductions.forEach(item => {
        doc
          .text(item.label, 350, rowY)
          .text(item.amount.toLocaleString('en-IN'), 500, rowY);
        rowY += 15;
      });

      // Total deductions
      const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
      doc
        .fontSize(11)
        .fillColor('#2563eb')
        .text('Total Deductions', 350, rowY + 5)
        .text(totalDeductions.toLocaleString('en-IN'), 500, rowY + 5);

      // Net Payable
      const netPayable = totalEarnings - totalDeductions;
      doc
        .fontSize(14)
        .fillColor('#2563eb')
        .text('Net Payable', 50, rowY + 40)
        .fontSize(16)
        .text(`₹ ${netPayable.toLocaleString('en-IN')}`, 200, rowY + 35);

      // Amount in words
      doc
        .fontSize(10)
        .fillColor('#000000')
        .text(`Amount in words: ${numberToWords(netPayable)} Rupees Only`, 50, rowY + 60);

      // Signatures
      doc
        .fontSize(10)
        .text('Employee Signature', 50, 650)
        .text('_________________________', 50, 660)
        .text('Admin Signature', 350, 650)
        .text('_________________________', 350, 660);

      // Digital watermark if signed
      if (payroll.isLocked) {
        doc
          .fontSize(60)
          .fillColor('#cccccc')
          .text('DIGITALLY SIGNED', 150, 400, { 
            align: 'center',
            opacity: 0.3,
            angle: 45
          });
      }

      // Footer
      doc
        .fontSize(8)
        .fillColor('#666666')
        .text(
          'This is a computer generated salary slip. Valid only with digital signatures.',
          50,
          700,
          { align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate report PDF
exports.generateReportPDF = async (reportData, title) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = createPDF();
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc
        .fillColor('#2563eb')
        .fontSize(20)
        .text('OpenMind WorkTrack', { align: 'center' })
        .fontSize(14)
        .text(title, { align: 'center' })
        .moveDown();

      // Report content
      doc
        .fontSize(10)
        .fillColor('#000000');

      // Add summary cards
      if (reportData.summary) {
        reportData.summary.forEach(item => {
          doc.text(`${item.label}: ${item.value}`, { continued: true });
        });
        doc.moveDown();
      }

      // Add table
      if (reportData.table) {
        doc
          .fontSize(12)
          .fillColor('#2563eb')
          .text('Details', { underline: true })
          .fillColor('#000000')
          .fontSize(10);

        let y = doc.y + 10;
        const tableTop = y;
        
        // Headers
        reportData.table.headers.forEach((header, i) => {
          doc.text(header, 50 + (i * 150), tableTop);
        });

        // Rows
        y = tableTop + 20;
        reportData.table.rows.forEach((row) => {
          row.forEach((cell, i) => {
            doc.text(String(cell), 50 + (i * 150), y);
          });
          y += 15;
        });
      }

      // Footer with generation time
      doc
        .fontSize(8)
        .fillColor('#666666')
        .text(
          `Generated on: ${new Date().toLocaleString()}`,
          50,
          700,
          { align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Helper function to convert number to words
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  const numToWords = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
  };
  
  return numToWords(num);
}