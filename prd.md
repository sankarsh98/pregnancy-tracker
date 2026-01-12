# Pregnancy Tracker Web App – Product Requirements Document (PRD)

## 1. Product Overview
The Pregnancy Tracker Web App is a privacy-first, calming, and easy-to-use web application designed to help pregnant users track pregnancy progress, daily health logs, appointments, and milestones from conception to delivery.

The app is informational and organizational only. It does NOT provide medical advice, diagnosis, or treatment.

---

## 2. Problem Statement
Pregnant users often rely on multiple fragmented tools (mobile apps, notes, WhatsApp reminders, paper records), leading to:
- Poor continuity of data
- Missed appointments or logs
- Increased anxiety
- Difficulty sharing structured data with doctors

---

## 3. Goals & Objectives
### Primary Goals
- Provide a single source of truth for pregnancy tracking
- Enable fast daily logging
- Present pregnancy progress clearly week-by-week
- Allow clean export of data for doctor visits

### Success Metrics
- User completes onboarding in under 2 minutes
- Daily log entry takes less than 30 seconds
- Exported PDF is doctor-readable
- No critical security or privacy issues

---

## 4. Target Users
### Primary
- Pregnant individuals (tech-literate, mobile-first)

### Secondary (Future)
- Partners / caregivers (read-only)
- Doctors (via exported reports only)

---

## 5. User Journeys

### 5.1 First-Time User
1. Sign up
2. Enter pregnancy start date (LMP) or due date
3. See dashboard with:
   - Current pregnancy week/day
   - Trimester
   - Days remaining
4. Prompted to add today’s log

### 5.2 Daily Use
- Open app on phone
- Add symptoms, mood, and notes
- Review weekly progress

### 5.3 Doctor Visit
- Add appointment
- Export pregnancy summary PDF
- Share with doctor

---

## 6. Feature Scope

### In Scope (MVP)
- User authentication
- Pregnancy timeline calculation
- Daily logs
- Appointments & reminders
- Educational content
- PDF and CSV export

### Out of Scope (v1)
- Medical diagnosis or alerts
- Emergency advice
- AI-generated health insights
- Wearable integrations
- Push notifications
- Doctor or partner accounts

---

## 7. Functional Requirements

### 7.1 Authentication
- Email + password signup/login
- Secure password hashing
- JWT-based session handling

### 7.2 Pregnancy Tracking
- Calculate pregnancy week/day using LMP
- Auto-calculate due date (editable)
- Display trimester and milestones

### 7.3 Daily Logs
- One log per day (merge updates)
- Editable historical entries
- Fields:
  - Symptoms (multi-select + free text)
  - Mood
  - Notes
  - Optional vitals (weight, BP, sugar)

### 7.4 Appointments
- Create, edit, delete appointments
- Date & time
- Notes and location

### 7.5 Educational Content
- Static, curated content
- Per week or trimester
- Neutral, non-alarmist tone

### 7.6 Reports & Export
- PDF pregnancy summary
- CSV export of logs
- No public sharing by default

---

## 8. Non-Functional Requirements
- Mobile-first responsive UI
- Page load < 2 seconds on average
- High accessibility (large touch targets, readable fonts)
- GDPR-style data deletion
- Clear medical disclaimer

---

## 9. Risks & Mitigations
| Risk | Mitigation |
|----|----|
| Medical liability | Strong disclaimers, no advice |
| Sensitive data | Encryption, minimal data storage |
| User anxiety | Calm UX, neutral wording |

---

## 10. MVP Definition
The MVP is considered complete when:
- Users can track pregnancy week
- Add daily logs
- Manage appointments
- View educational content
- Export PDF and CSV
- Data is secure and private

---

## 11. Assumptions
- Users are comfortable using web apps on mobile browsers
- Only one active pregnancy per user in v1
- Educational content is informational only

---

End of PRD
