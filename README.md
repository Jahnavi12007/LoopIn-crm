# LoopIn CRM

Never forget a customer. Never miss a follow-up. Never lose track of
a payment.

Loopin is a lightweight, WhatsApp-first CRM designed for small businesses
that manage customers, follow-ups, payments, and repeat business without
wanting the complexity of a traditional enterprise CRM.

✨ Why Loopin?

Many small businesses manage customer information through WhatsApp
chats, notebooks, spreadsheets, and memory. Loopin brings the essential
workflow into one simple workspace:

Customer → Charge/Payment → Follow-up → WhatsApp → Repeat Business

The goal is to make customer management simple, calm, and practical for
businesses that primarily communicate through WhatsApp.

🚀 Features

Customer Management

Add, edit, search, filter, archive, and restore customers

Customer profiles with relevant activity and payment information

Lead/customer workflow

Follow-up Management

Create and schedule follow-ups

Edit, reschedule, complete, and reopen follow-ups

Quick WhatsApp and call actions

Follow-up notifications

Payments & Charges

Create charges/invoices

Record payments

Track pending amounts

Support customer credit/advance balances

Payment history and payment status

WhatsApp Templates

Create and manage reusable message templates

Template variables such as customer name and amount

Copy templates and open WhatsApp with a prepared message

Dashboard & Analytics

Customer and payment overview

Follow-up activity

Business analytics

Dynamic statistics

Authentication & Account

Login and signup

Password reset flow

Business/account settings

Demo subscription modes

Responsive UI

Mobile-first experience

Sidebar and bottom navigation

Clean, premium visual design

Accessible dialog components

🛠️ Tech Stack

Frontend

React

TypeScript

Vite

Tailwind CSS

UI & Components

Radix UI

shadcn-style reusable components

Lucide icons

Development

Node.js

npm

ESLint

Vitest

Integrations

WhatsApp deep links

Browser/local storage based application data

Real payment gateway integration is intentionally deferred while the
core product is being developed.

📁 Project Structure

web-LoopIn/
├── public/
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── icons/
│   │   ├── layout/
│   │   ├── modals/
│   │   └── ui/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   │   └── auth/
│   ├── services/
│   ├── test/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts

💻 Getting Started

1. Clone the repository

git clone https://github.com/Jahnavi12007/LoopIn-crm.git
cd LoopIn-crm

2. Install dependencies

npm install

3. Start the development server

npm run dev

The application will be available at the local URL shown by Vite,
typically:

http://localhost:8080/

🔐 Environment Variables

If environment variables are added in the future, keep them in a local
.env file.

.env files are excluded from Git through .gitignore and should never
contain secrets that are committed to the repository.

🧪 Testing

Run the project's configured tests with:

npm test

If your local package scripts use a different test command, check
package.json.

🎯 Target Users

Loopin is designed for small, WhatsApp-first businesses such as:

Salons and beauty businesses

Tailors and boutiques

Repair and service businesses

Tutors and small coaching businesses

Photographers and event services

Home-service providers

Small local retailers

🗺️ Product Direction

Planned areas of development include:

More robust backend/cloud persistence

Production authentication

Real payment gateway integration

Stronger notification infrastructure

More automation around follow-ups

Business-level reporting

Production deployment and monitoring

📌 Current Status

Loopin is an actively developed project. The current version focuses on
validating the core CRM workflow and user experience before introducing
production payment infrastructure and additional integrations.

👩‍💻 Author

Jahnavi12007

B.Tech Computer Science & Engineering

GitHub: @Jahnavi12007

If Loopin is useful to you, feel free to ⭐ the repository.
