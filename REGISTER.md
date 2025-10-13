# PrimeCare Registration System & Hospital Dashboard Requirements

## 🏥 Hospital Hierarchy System

### Main Hospital vs Regional Hospital Structure
- **Main Hospitals**: Independent hospitals that generate a unique Hospital Code after registration
- **Regional Hospitals**: Subsidiary hospitals that register under a Main Hospital using the Main Hospital's code
- **Hospital Code**: Unique identifier (e.g., HC-001) generated for Main Hospitals only
- **Affiliation**: Regional hospitals are linked to Main Hospitals through the Hospital Code

### Data Access Rules
- **Main Hospitals**: Can view ALL data (their own + all regional hospitals under them)
- **Regional Hospitals**: Can ONLY view their own hospital data
- **Dashboard Views**: Different based on hospital type (Main vs Regional)

## 🔐 Authentication & Registration Flow

### Landing Page Options
Create a landing page with TWO registration buttons:

1. **"Register as Main Hospital"** - For independent hospitals
2. **"Register as Regional Hospital"** - For hospitals under a Main Hospital

### Login Page
- Standard email/password login
- After login, system determines if user is Main or Regional hospital
- Redirects to appropriate dashboard view based hospital type

## 📝 Registration Forms

### 1. Collection Center Registration
```
🔹 COLLECTION CENTER REGISTRATION

Basic Details (App Installation):
├── Name (Text Input)
├── Email (Email Input)
└── Mobile Phone Number (Phone Input)

Collection Center Information:
├── Contact Person Name (Text Input)
├── Contact Person Mobile Number (Phone Input)
├── Address (Textarea)
├── Location (GPS Picker - Lat/Long)
└── Landline Number (Phone Input)

Hospital Affiliation:
├── Select Main Hospital (Dropdown - Optional)
├── Select Regional Hospitals (Multi-select under chosen Main Hospital)
└── Request Additional Hospitals (Text area for requests)

Buttons: [Submit Registration] [Cancel]
```

### 2. Hospital Registration

#### Main Hospital Registration
```
🔹 MAIN HOSPITAL REGISTRATION

Basic Details:
├── Name (Text Input)
├── Email (Email Input)
└── Mobile Phone Number (Phone Input)

Hospital Information:
├── Contact Person Name (Text Input)
├── Contact Person Mobile Number (Phone Input)
├── Address (Textarea)
├── Location (GPS Picker)
└── Landline Number (Phone Input)

System Generated:
└── Hospital Code (Auto-generated after approval - e.g., HC-001)

Buttons: [Register as Main Hospital] [Cancel]
```

#### Regional Hospital Registration
```
🔹 REGIONAL HOSPITAL REGISTRATION

Basic Details:
├── Name (Text Input)
├── Email (Email Input)
└── Mobile Phone Number (Phone Input)

Hospital Information:
├── Contact Person Name (Text Input)
├── Contact Person Mobile Number (Phone Input)
├── Address (Textarea)
├── Location (GPS Picker)
└── Landline Number (Phone Input)

Main Hospital Affiliation:
└── Hospital Code (Text Input - Required)
    └── Helper text: "Enter the Hospital Code provided by your Main Hospital"

Buttons: [Register as Regional Hospital] [Cancel]
```

### 3. Rider Registration
```
🔹 RIDER REGISTRATION

Basic Details:
├── Name (Text Input)
├── Email (Email Input)
└── Mobile Phone Number (Phone Input)

Rider Information:
├── Full Name (Text Input)
├── Mobile Number (Phone Input)
├── Vehicle Number (Text Input)
├── Driver's License (File Upload - Image)
└── NIC Image (File Upload - Image)

Hospital Affiliation:
├── Select Main Hospital (Dropdown - Optional)
├── Select Regional Hospitals (Multi-select under Main Hospital)
└── Request Additional Hospitals (Textarea)

Buttons: [Submit Registration] [Cancel]
```

## 🏗️ Hospital Dashboard Structure

### Main Hospital Dashboard Features
```
Main Hospital Dashboard (Full Access):

📊 Dashboard Overview:
├── Combined metrics (Main + All Regional hospitals)
├── Total active orders across network
├── All riders in the network
└── Network-wide SLA compliance

📋 Orders Management:
├── View orders from Main hospital
├── View orders from ALL regional hospitals
├── Filter by hospital (Main + Regional options)
└── Assign riders from entire network

👥 Rider Management:
├── Approve riders for Main hospital
├── Approve riders for Regional hospitals
├── Manage entire network of riders
└── Performance metrics across network

🏥 Regional Hospital Management:
├── View all Regional hospitals under Main
├── Approve/Reject Regional hospital registrations
├── Manage Regional hospital settings
├── Monitor Regional hospital performance
└── Regional hospital contact information

🏢 Collection Centers:
├── Approve centers for Main hospital
├── Approve centers for Regional hospitals
├── View all centers in network
└── Manage center relationships

📈 Reports & Analytics:
├── Network-wide reporting
├── Individual hospital breakdowns
├── Comparative analysis between hospitals
└── Billing reports for entire network

⚙️ Settings:
├── Main hospital settings
├── Network configuration
├── Regional hospital permissions
└── Hospital code management
```

### Regional Hospital Dashboard Features
```
Regional Hospital Dashboard (Limited Access):

📊 Dashboard Overview:
├── THIS hospital's metrics only
├── Orders for THIS hospital only
├── Riders assigned to THIS hospital
└── THIS hospital's SLA compliance

📋 Orders Management:
├── View orders for THIS hospital only
├── Assign riders from THIS hospital's pool
└── No access to other hospital orders

👥 Rider Management:
├── Approve riders for THIS hospital only
├── Manage riders assigned to THIS hospital
└── Performance metrics for THIS hospital's riders

🏢 Collection Centers:
├── Approve centers for THIS hospital only
├── View centers affiliated with THIS hospital
└── No access to other hospital's centers

📈 Reports & Analytics:
├── THIS hospital's performance only
├── No comparative data with other hospitals
├── THIS hospital's billing data only
└── Limited to own hospital metrics

⚙️ Settings:
├── THIS hospital's settings only
├── Contact information updates
└── No network configuration access

❌ RESTRICTED ACCESS:
├── Cannot view Main hospital data
├── Cannot view other Regional hospitals
├── Cannot manage Regional hospital registrations
├── Cannot access network-wide reports
```

## 🔄 Registration Approval Workflow

### Collection Center Approval
1. Collection Center submits registration
2. Selected Hospital(s) review and approve/reject
3. PrimeCare HQ gives final approval
4. Features enabled (sample types, urgency levels)

### Regional Hospital Approval
1. Regional Hospital submits with Hospital Code
2. Main Hospital (owner of code) approves/rejects
3. PrimeCare HQ gives final approval
4. Regional Hospital gets limited dashboard access

### Rider Approval
1. Rider submits registration with documents
2. Selected Hospital(s) review documents and approve/reject
3. Rider can start working for approved hospitals

## 🎯 Key Dashboard Differences

### Navigation Menu Differences
**Main Hospital Menu:**
- Dashboard
- Orders Management
- Live Tracking
- Rider Management
- Regional Hospitals ← UNIQUE TO MAIN
- Collection Centers
- Reports & Analytics
- Audit & Compliance
- Settings

**Regional Hospital Menu:**
- Dashboard
- Orders Management
- Live Tracking
- Rider Management
- Collection Centers
- Reports & Analytics
- Audit & Compliance
- Settings

### Data Filtering
**Main Hospital:**
- "All Hospitals" option in filters
- Individual hospital selection (Main + Regionals)
- Network-wide analytics

**Regional Hospital:**
- No hospital filter (only their data)
- Single hospital view only
- No comparative analytics

## 🔧 Implementation Requirements

### Authentication Logic
```typescript
// After login, determine hospital type
if (user.hospitalType === 'MAIN') {
  // Redirect to Main Hospital Dashboard
  // Load network data (main + regional)
  // Show full feature set
} else if (user.hospitalType === 'REGIONAL') {
  // Redirect to Regional Hospital Dashboard  
  // Load only this hospital's data
  // Hide restricted features
}
```

### Registration Page Routes
```
/register → Landing page with two buttons
/register/main-hospital → Main hospital registration form
/register/regional-hospital → Regional hospital registration form
/login → Standard login page
```

### Dashboard Access Control
```typescript
// Component-level access control
{user.hospitalType === 'MAIN' && (
  <RegionalHospitalManagement />
)}

// Data fetching with hospital context
const orders = hospitalType === 'MAIN' 
  ? getAllNetworkOrders() 
  : getThisHospitalOrders();
```

## 🎨 UI Components Needed

1. **Registration Landing Page** - Two prominent buttons
2. **Hospital Registration Forms** - Different fields for Main vs Regional
3. **Regional Hospital Management Page** - Only for Main hospitals
4. **Access-controlled Components** - Show/hide based on hospital type
5. **Data Filters** - Different options for Main vs Regional
6. **Hospital Code Display** - Show code for Main hospitals
7. **Network Overview** - Only for Main hospitals

This system ensures proper hierarchy management while maintaining data security and appropriate access levels for each hospital type.