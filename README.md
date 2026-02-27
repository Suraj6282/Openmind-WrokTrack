# OpenMind WorkTrack - Enterprise Attendance & Payroll System

A complete production-ready MERN Stack Progressive Web Application for attendance, leave, payroll, and digital signature management.

## Features

✅ **Authentication & Security**
- JWT-based authentication
- Role-based access (Admin/Employee)
- Device binding and IP logging
- Audit logs for every action

📍 **Geo-fenced Attendance**
- 20-meter radius restriction
- Haversine distance calculation
- Check-in/out with location tracking
- Break management
- Late detection and auto calculations

🏖 **Leave Management**
- Multiple leave types (Paid/Unpaid/Sick)
- Leave approval workflow
- Leave balance tracking
- Integration with payroll

💰 **Full Payroll System**
- Auto salary calculation
- Overtime and penalty rules
- Salary slip generation
- Lock after approval

✍ **Digital Signature System**
- Signature pad on mobile
- Signature verification
- Watermarked salary slips
- Device and IP tracking

📊 **Advanced Analytics**
- Real-time dashboard
- Attendance trends
- Performance ranking
- Audit log viewer

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, Bcrypt
- **PWA**: Service Workers, Workbox
- **Real-time**: Socket.io
- **PDF Generation**: jsPDF, PDFKit
- **Maps**: Google Maps API, Haversine formula

## Installation

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Redis (optional, for rate limiting)

### Environment Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/openmind-worktrack.git
cd openmind-worktrack