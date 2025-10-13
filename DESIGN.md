# PrimeCare Hospital Dashboard - Complete Design System

## 🎨 Design Theme & Visual Identity

**Overall Aesthetic**: Clean, modern healthcare dashboard with a professional medical feel. The design emphasizes clarity, accessibility, and real-time monitoring capabilities.

## 🎯 Color Palette

### Primary Colors
- **Primary Teal**: `#5DADE2` - Main accent color for buttons, active states, and highlights
- **Light Teal**: `#85C1E9` - Secondary teal for hover states and light accents
- **Dark Teal**: `#3498DB` - Darker shade for active navigation and emphasis

### Status Colors
- **Success Green**: `#58D68D` - For completed orders, active status, approved items
- **Warning Orange**: `#F39C12` - For pending items, delays, warnings
- **Error Red**: `#E74C3C` - For urgent orders, errors, rejections
- **Info Blue**: `#3498DB` - For information badges and neutral states

### Background Colors
- **Main Background**: `#F8F9FA` - Light gray background for the entire dashboard
- **Card Background**: `#FFFFFF` - Pure white for cards, tables, and content areas
- **Sidebar Background**: `#FFFFFF` - White sidebar with subtle shadow
- **Header Background**: `#FFFFFF` - White header with bottom border

### Text Colors
- **Primary Text**: `#2C3E50` - Dark gray for main content and headings
- **Secondary Text**: `#7B8794` - Medium gray for labels and secondary information
- **Muted Text**: `#BDC3C7` - Light gray for timestamps and less important text
- **White Text**: `#FFFFFF` - For text on colored backgrounds

## 📐 Layout Structure

### Sidebar Navigation
- **Width**: 240px fixed width
- **Background**: Pure white (`#FFFFFF`)
- **Shadow**: Subtle right shadow `box-shadow: 2px 0 4px rgba(0,0,0,0.1)`
- **Logo Area**: Top section with "PrimeCare Dashboard" title
- **Menu Items**: 
  - Normal state: Gray text with left border on hover
  - Active state: Teal background (`#5DADE2`) with white text and rounded corners
  - Icons: Use Lucide React icons in matching colors

### Header Bar
- **Height**: 64px
- **Background**: White with bottom border (`#E5E7EB`)
- **Content**: Hospital name on left, user profile and notifications on right
- **Typography**: Hospital name in medium weight, user info in regular weight

### Main Content Area
- **Padding**: 24px on all sides
- **Background**: Light gray (`#F8F9FA`)
- **Content flows vertically with proper spacing between sections

## 📊 Cards & Components

### Metric Cards (Dashboard Overview)
- **Background**: Pure white (`#FFFFFF`)
- **Border Radius**: 8px
- **Shadow**: `box-shadow: 0 1px 3px rgba(0,0,0,0.1)`
- **Padding**: 24px
- **Number Display**: Large, bold text in primary color
- **Label**: Small, gray text below the number
- **Icon**: Colored circle background with white icon

### Data Tables
- **Background**: White cards with 8px border radius
- **Header**: Light gray background (`#F8F9FA`) with medium weight text
- **Rows**: Alternating white rows with hover state (`#F8F9FA`)
- **Borders**: Light gray borders (`#E5E7EB`) between rows
- **Padding**: 16px vertical, 24px horizontal for cells

### Status Badges
- **Urgent**: Red background (`#E74C3C`) with white text, rounded corners
- **Routine**: Blue background (`#3498DB`) with white text
- **Active**: Green background (`#58D68D`) with white text
- **Pending**: Orange background (`#F39C12`) with white text
- **Size**: Small padding (4px 12px), font-size: 12px, font-weight: 500

## 🔘 Buttons & Interactive Elements

### Primary Buttons
- **Background**: Teal (`#5DADE2`)
- **Text**: White (`#FFFFFF`)
- **Padding**: 12px 24px
- **Border Radius**: 6px
- **Hover**: Darker teal (`#3498DB`)
- **Font Weight**: 500 (medium)

### Secondary Buttons
- **Background**: White (`#FFFFFF`)
- **Text**: Teal (`#5DADE2`)
- **Border**: 1px solid teal (`#5DADE2`)
- **Hover**: Light teal background (`#EBF8FF`)

### Action Buttons (Approve/Reject)
- **Approve**: Green background (`#58D68D`) with white text
- **Reject**: Red background (`#E74C3C`) with white text
- **Size**: Small (8px 16px padding)

## 📈 Charts & Visualizations

### Performance Charts
- **Primary Color**: Teal (`#5DADE2`) for main data
- **Secondary Color**: Light teal (`#85C1E9`) for comparison data
- **Grid Lines**: Light gray (`#E5E7EB`)
- **Background**: White
- **Tooltips**: Dark background with white text

### Donut Charts
- **Primary Slice**: Teal (`#5DADE2`)
- **Secondary Slices**: Various blues and teals
- **Center Text**: Large number with label below

## 🗺️ Maps & Tracking

### Live Map Component
- **Background**: Standard map tiles (light theme)
- **Rider Markers**: Circular teal markers (`#5DADE2`) with white icons
- **Route Lines**: Teal color (`#5DADE2`) with 3px width
- **Info Cards**: White background with shadow overlay

## 📱 Forms & Inputs

### Input Fields
- **Background**: White (`#FFFFFF`)
- **Border**: Light gray (`#E5E7EB`)
- **Focus**: Teal border (`#5DADE2`)
- **Padding**: 12px 16px
- **Border Radius**: 6px
- **Placeholder**: Medium gray text (`#7B8794`)

### Dropdowns & Selects
- **Same styling as input fields**
- **Dropdown Arrow**: Gray color
- **Options**: White background with hover states

## 🔔 Alerts & Notifications

### Alert Cards
- **Critical**: Red left border (4px) with light red background (`#FEF2F2`)
- **Warning**: Orange left border with light orange background (`#FFFBEB`)
- **Info**: Blue left border with light blue background (`#EFF6FF`)
- **Success**: Green left border with light green background (`#F0FDF4`)

### Live Alerts Section
- **Background**: White card
- **Alert Items**: Left colored border matching alert type
- **Timestamp**: Small gray text on the right
- **Take Action Button**: Small teal button

## 📊 Specific Screen Layouts

### Dashboard Home
- **Top Row**: 4 metric cards in equal grid
- **Second Row**: Collection Centers Status table (full width)
- **Third Row**: Live Alerts (left) + Quick Actions (right) in 2:1 ratio
- **Bottom**: Recent Hospital Activity timeline

### Orders Management
- **Filter Bar**: Search + filter buttons in horizontal layout
- **Main Table**: Full width with priority badges and status indicators
- **Pagination**: Bottom center with page numbers

### Rider Management
- **Top Tabs**: Pending Approvals, Active Riders, Performance Reports
- **Approval Cards**: White cards with rider info, documents, and action buttons
- **Active Riders Table**: Status indicators, ratings, and performance metrics

### Live Tracking
- **Left Side**: Interactive map (70% width)
- **Right Sidebar**: Active riders list (30% width) with status indicators
- **Bottom Stats**: Delivery metrics in small cards

## 📏 Typography Scale

### Heading Hierarchy
- **H1 (Page Titles)**: 32px, font-weight: 600, color: `#2C3E50`
- **H2 (Section Titles)**: 24px, font-weight: 600, color: `#2C3E50`
- **H3 (Card Titles)**: 18px, font-weight: 500, color: `#2C3E50`
- **H4 (Subsections)**: 16px, font-weight: 500, color: `#2C3E50`

### Body Text
- **Regular Body**: 14px, font-weight: 400, color: `#2C3E50`
- **Small Text**: 12px, font-weight: 400, color: `#7B8794`
- **Labels**: 12px, font-weight: 500, color: `#7B8794`

### Numbers & Metrics
- **Large Numbers**: 36px, font-weight: 700, color varies by context
- **Medium Numbers**: 24px, font-weight: 600
- **Small Numbers**: 16px, font-weight: 500

## 🎯 Component Spacing

### Margins & Padding
- **Page Padding**: 24px all sides
- **Card Padding**: 24px all sides
- **Section Spacing**: 32px between major sections
- **Element Spacing**: 16px between related elements
- **Tight Spacing**: 8px for closely related items

### Grid System
- **Cards**: Use CSS Grid with 1fr units and 24px gaps
- **Tables**: Full width with responsive horizontal scrolling
- **Mobile**: Single column layout with full-width cards

## 🎨 Visual Effects

### Shadows
- **Card Shadow**: `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1)`
- **Hover Shadow**: `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15)`
- **Modal Shadow**: `box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2)`

### Borders
- **Default Border**: 1px solid `#E5E7EB`
- **Focus Border**: 2px solid `#5DADE2`
- **Section Dividers**: 1px solid `#E5E7EB`

### Transitions
- **Hover Effects**: `transition: all 0.2s ease-in-out`
- **Loading States**: Subtle shimmer effect in light gray
- **State Changes**: Smooth 0.3s transitions for status updates

## 📱 Responsive Behavior

### Desktop (1200px+)
- Full sidebar navigation
- Multi-column card layouts
- Large data tables with all columns

### Tablet (768px - 1199px)
- Collapsible sidebar
- 2-column card layouts
- Horizontally scrollable tables

### Mobile (< 768px)
- Hidden sidebar with hamburger menu
- Single column layouts
- Stacked card designs
- Mobile-optimized tables

---

## 🛠️ Implementation Notes for Claude

When building components, ensure:
1. Use Tailwind CSS classes that match these exact colors and spacing
2. Implement proper hover and focus states
3. Add loading states for data fetching
4. Include proper accessibility attributes
5. Use React hooks for state management
6. Implement real-time updates with Socket.io
7. Add proper error handling and empty states
8. Ensure responsive design across all screen sizes

This design system creates a cohesive, professional healthcare dashboard that prioritizes usability and real-time monitoring capabilities.