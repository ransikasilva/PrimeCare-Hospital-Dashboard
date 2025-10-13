# PrimeCare Sample Delivery System - Complete Development Guide

## 🎯 Project Overview

**PrimeCare** is a comprehensive sample delivery system for Sri Lanka's healthcare network, connecting collection centers, hospitals, riders, and operations through a hospital-centric approach.

### Core Components
- **Collection Centers** - Medical labs that send blood/urine samples (Dependent/Independent types)
- **Hospitals** - Main hospitals (with codes) and Regional hospitals under them
- **Riders** - Motorcycle/vehicle couriers affiliated with specific hospitals
- **Operations** - PrimeCare HQ managing the entire system

### Authentication Methods
- **Mobile Apps** (Collection Centers, Riders): Phone + SMS OTP (Text.lk/Twilio)
- **Dashboards** (Hospital, Operations): Email + Password

## 🏗️ Complete System Architecture

### Applications Built
1. **App A: Collection Center (Mobile)** ✅ BACKEND COMPLETE
   - Hospital-based registration (dependent/independent)
   - Order creation with automatic QR generation
   - Real-time rider tracking
   - Feature management (sample types, urgency levels)

2. **App B: Rider (Mobile)** ✅ BACKEND COMPLETE
   - Multi-hospital registration using hospital codes
   - Job acceptance with QR scanning requirements
   - GPS location tracking
   - Handover system for rider-to-rider transfers

3. **Dashboard A: Hospital (Web)** 🚧 IN DEVELOPMENT
   - Rider approval and management
   - Collection center approval workflow
   - Live order monitoring and assignment
   - Real-time GPS tracking of riders
   - Monthly KM reports for billing

4. **Dashboard B: Operations (Web)** ⏳ PENDING
   - System-wide oversight and analytics
   - Final approvals (post-hospital approval)
   - Feature management for collection centers
   - Subscription billing management
   - QR compliance monitoring

## 🔄 Complete Business Flow

### 1. Registration Flow
**Main Hospital Registration:**
1. Hospital user registers with email/password
2. Creates main hospital → gets unique hospital code (e.g., HC-001)
3. PrimeCare operations approves

**Regional Hospital Registration:**
1. Regional hospital uses main hospital's code
2. Main hospital approves the regional hospital
3. Now both hospitals share the same network

**Collection Center Registration:**
1. Center chooses: Dependent (1 hospital) or Independent (multiple hospitals)
2. Selects hospitals from available networks using hospital codes
3. Selected hospital(s) approve the center
4. PrimeCare HQ gives final approval + enables features (sample types, urgency)

**Rider Registration:**
1. Rider selects hospital(s) using hospital code
2. Uploads license + NIC images
3. Hospital approves rider
4. Rider can now work for that hospital network

### 2. Order Flow (Complete Journey)
**Step 1: Order Creation**
- Collection center creates order (sample type, urgency, hospital)
- System generates pickup QR code with security hash
- System finds best rider from target hospital (not proximity-based)

**Step 2: Rider Assignment Algorithm**
- Score riders based on: distance (40%), rating (25%), experience (20%), GPS freshness (10%), vehicle type (5%)
- Assign highest scoring available rider from target hospital
- Auto-assign after 2 minutes for urgent/emergency orders

**Step 3: Pickup Process**
- Rider accepts job → navigates to collection center
- Rider MUST scan pickup QR code to confirm pickup
- Cannot mark "picked up" without QR scan verification
- System tracks GPS location throughout journey

**Step 4: Delivery Process**
- Hospital generates delivery QR code
- Rider delivers samples to hospital lab
- Hospital staff scans QR code to confirm delivery
- All QR activities logged for chain of custody

**Step 5: Multi-Parcel & Handover System**
- **Multi-parcel routes**: If rider has multiple parcels for same hospital → combined QR
- **Handover system**: If rider has emergency → can handover to another rider with QR verification
- **Route optimization**: System suggests combining orders going to same hospital

### 3. QR Code System (Complete Chain of Custody)
**QR Types Generated:**
- **Pickup QR**: When order created (7-day expiry)
- **Handover QR**: When rider transfers to another rider (2-hour expiry)
- **Combined QR**: Multiple parcels to same hospital (8-hour expiry)
- **Delivery QR**: Hospital confirmation (24-hour expiry)

**Security Features:**
- HMAC-SHA256 signatures prevent tampering
- Unique QR IDs with timestamps
- Complete scan history tracked
- Chain of custody from pickup → handover → delivery

### 4. Real-time Features
**Live Tracking:**
- GPS location updates every few seconds
- Route visualization on maps
- ETA calculations with traffic
- Live status updates (assigned → pickup started → picked up → delivery started → delivered)

**Live Alerts:**
- Sample pickup delayed (>30 min late)
- Urgent samples pending assignment
- Rider cancellations
- QR code compliance issues

## 🖼️ Hospital Dashboard Pages (From Your Designs)

1. **Dashboard Home** - Overview metrics (18 active orders, 8 riders, 47 completed, 96% SLA)
2. **SLA Compliance & Alerts** - 95.8% compliance, 12 critical alerts, 42m average time
3. **Live Order Feed** - Real-time orders with filters, priority badges, ETA tracking
4. **Live Rider Tracking** - Interactive GPS map with active riders (3 riders shown)
5. **Rider Management** - Pending approvals (Priya Silva, Kamal Fernando) with documents
6. **Collection Centers** - Approval workflow (HealthGuard, MediCare Diagnostics)
7. **Reports & Analytics** - Performance charts, delivery volume, monthly KM reports
8. **Audit & Compliance** - Chain of custody viewer, QR scan history, compliance rating
9. **Settings** - Hospital info, user management, notification preferences

## 🚀 MINIMAL Frontend Structure (20 Files)

```
hospital-dashboard/
├── app/
│   ├── login/page.tsx           # Login with email/password
│   ├── dashboard/page.tsx       # Main dashboard overview
│   ├── orders/page.tsx          # Live order feed
│   ├── tracking/page.tsx        # GPS rider tracking
│   ├── riders/page.tsx          # Rider management
│   ├── centers/page.tsx         # Collection centers
│   ├── reports/page.tsx         # Analytics & reports
│   ├── audit/page.tsx           # Compliance & QR logs
│   ├── settings/page.tsx        # Hospital settings
│   ├── layout.tsx               # Root layout with sidebar
│   └── globals.css              # Tailwind styles
├── components/
│   ├── Sidebar.tsx              # Navigation menu
│   ├── Header.tsx               # Top header
│   ├── MetricsCards.tsx         # Dashboard stats (18, 8, 47, 96%)
│   ├── OrdersTable.tsx          # Live orders table
│   ├── RidersTable.tsx          # Riders management
│   ├── LiveMap.tsx              # GPS tracking map
│   ├── CentersTable.tsx         # Collection centers
│   ├── SLACharts.tsx            # Analytics charts
│   └── AuditViewer.tsx          # QR compliance logs
├── lib/
│   ├── api.ts                   # API client
│   ├── auth.ts                  # Authentication
│   └── types.ts                 # TypeScript types
├── hooks/
│   ├── useAuth.ts               # Login/logout
│   ├── useRealtime.ts           # Socket.io live updates
│   └── useApi.ts                # Data fetching
└── package.json                 # Dependencies
```

## 🔧 Quick Setup (5 minutes)

```bash
# 1. Create Next.js project
npx create-next-app@latest hospital-dashboard --typescript --tailwind --eslint --app

# 2. Install essentials only
npm install @tanstack/react-query zustand axios recharts lucide-react socket.io-client

# 3. Add Shadcn UI components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card table badge alert dialog

# 4. Environment setup
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local
echo "NEXT_PUBLIC_SOCKET_URL=http://localhost:3000" >> .env.local
```

## 📊 Key Features to Implement

### Dashboard Home Features
- **Metrics Cards**: 18 Active Orders, 8 Riders Available, 47 Completed Today, 96% SLA
- **Collection Centers Status**: Table with Name, Location, Active Orders, Last Pickup, Status
- **Live Alerts**: Sample pickup delayed, Urgent samples pending, Near-miss delivery time
- **Quick Actions**: Register Center, View Orders, Manage Riders, View Reports

### Orders Management Features  
- **Live Order Feed**: Real-time table with Order ID, Priority, Collection Center, Samples, Rider, Status, ETA
- **Order Filters**: Search by center/rider, filter by priority/status, date range
- **Order Details Modal**: Full order info, QR code display, rider assignment, status timeline
- **Priority System**: Emergency (red), Urgent (orange), Routine (blue) badges

### Rider Management Features
- **Pending Approvals**: Queue of riders waiting for hospital approval with documents
- **Active Riders**: List with status (Available/Busy/Offline), ratings, total deliveries
- **Live Tracking**: Real-time GPS map showing rider locations and routes
- **Performance Metrics**: Delivery success rate, average time, customer ratings

### Collection Centers Features
- **Approval Workflow**: Review documents, verify license, approve/reject centers
- **Active Centers**: List with relationship type, status, recent activity
- **Hospital Affiliation**: Dependent (single hospital) vs Independent (multiple hospitals)

### Reports & Analytics Features
- **SLA Dashboard**: 95.8% compliance, critical alerts, average delivery times
- **Performance Charts**: Delivery volume by hour, sample types distribution
- **Monthly Reports**: KM reports for rider billing, efficiency metrics
- **Audit Logs**: Complete chain of custody, QR scan history

## 🔗 Backend API Integration

### Authentication Endpoints
```typescript
POST /auth/dashboard/login        // Hospital login
POST /auth/dashboard/refresh      // Token refresh
POST /auth/logout                // Logout
```

### Hospital Management
```typescript
GET /hospitals/my                 // Get user's hospitals
GET /hospitals/:id               // Hospital details
PUT /hospitals/:id               // Update hospital info
```

### Approval Workflows
```typescript
GET /approvals/hospitals/:hospitalId/pending    // Pending approvals
POST /approvals/riders/:riderId/approve         // Approve rider
POST /approvals/collection-centers/:centerId/approve  // Approve center
POST /approvals/reject/:type/:itemId            // Reject approval
```

### Orders Management
```typescript
GET /orders/hospital-orders      // Orders for hospital
GET /orders/:orderId            // Order details
POST /orders/:orderId/assign-rider  // Assign rider
PUT /orders/:orderId/status     // Update order status
```

### Real-time Features
```typescript
// Socket.io events
'order_created'         // New order notification
'rider_location_update' // GPS location updates  
'order_status_changed'  // Status updates
'alert_triggered'       // System alerts
```

## 🎯 Development Priority (4 Weeks)

**Week 1**: Layout + Dashboard Home
- Sidebar navigation with all menu items
- Header with hospital info and user profile
- Dashboard page with metrics cards and tables

**Week 2**: Orders + Real-time
- Live orders table with real-time updates
- Order details modal with QR codes
- Socket.io integration for live updates

**Week 3**: Riders + Tracking  
- Rider management with approval workflow
- Live GPS tracking map with markers
- Rider performance metrics

**Week 4**: Reports + Settings
- Analytics charts and KM reports  
- Audit logs and QR compliance
- Hospital settings and user management

## 🔒 Security & Compliance

- **JWT Authentication**: Access + refresh tokens
- **QR Code Security**: HMAC-SHA256 signatures
- **Role-based Access**: Hospital staff permissions
- **Audit Trail**: Complete chain of custody logging
- **Real-time Validation**: QR scan verification required
- **Data Protection**: Encrypted sensitive data

---

**Backend Status**: ✅ COMPLETE (All APIs ready)
**Frontend Status**: 🚧 Hospital Dashboard in development
**Next Goal**: Complete Hospital Dashboard in 4 weeks