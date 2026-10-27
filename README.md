# CarePoint Clinic — Integrated Multi-Portal Reservation, Queue & Observatory Suite

Full-stack **Laravel 13 API + React (Vite + Tailwind CSS v4) + MySQL 8.4** clinic reservation and live queue management platform with hardened security middlewares, multi-tier rate limiting, Nginx load balancer + CDN caching config, and GitHub Actions CI/CD.

##Quick Start (Laragon / Local)

1. **Open the Running App**:
   - **Development Server**: `http://localhost:8000` (via `php artisan serve`)
   - **Laragon Virtual Host**: `http://clinicreservation.test`

2. **Switch Between All 6 Portals Instantly** using the top sticky bar:
   - **1. Client Website**: Book an appointment by department, doctor, date, and real-time slot (`09:00 AM`, `09:30 AM`, `10:00 AM`, `10:30 AM (Reserved)`), view **My Quick Queue Status** (`G-105`), and track any ticket or booking reference.
   - **2. Queuing TV Display**: High-contrast clinic waiting room monitor with live clock (`NOW SERVING: A-102 -> ROOM 1`, `B-204 -> ROOM 3`), `UPCOMING QUEUE`, and scrolling ticker news.
   - **3. Staff / Reception Side**: Front-desk queue controller (`CURRENT TICKET AT DESK 1: A-101` with `CALL NEXT`, `SERVE`, `NO SHOW / RE-QUEUE`), walk-in & reservation check-in search, 1-click **Quick Ticket Generation** (`General [G]`, `Pediatric [P]`, `Dental [D]`, `Laboratory [L]`), and live **Who's Available** doctor status panel.
   - **4. Doctor Side**: View assigned patients & chief complaints, call patients to room, record clinical notes & prescriptions (`Rx`), edit clinic schedule/shift hours/working days, and edit physician profile details.
   - **5. Admin & Reports**: KPI overview (`Total Bookings`, `Currently Waiting`, `Served Today`, `Avg. Waiting Time`), interactive **7-Day Reservation & Queue Graph**, **Department Distribution Bar Graph**, **Doctor Utilization & Revenue Analytics**, CSV export, and queue management (`Call Next`, `Decline`, `Transfer`, `Soft Delete`).
   - **6. Super Admin Observatory**: Real-time MySQL latency & resource telemetry, **Load Balancer & CDN Cluster** status, **Multi-Tier Rate Limiter & WAF Security** monitor, **Crash Logs & Stack Trace Inspector** (with 1-click diagnostic simulator), and **Soft-Deleted Data Recovery Vault** (`Restore` or `Permanent Purge` for reservations, doctors, and users).
