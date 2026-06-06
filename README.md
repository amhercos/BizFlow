# BizFlow
**Enterprise-Grade Multi-Tenant POS & Inventory Management System**

BizFlow is a high-performance Point of Sale (POS) and Inventory solution built with **.NET 10** and **ReactNative**. Designed for scalability and resilience, it features a sophisticated multi-tenant architecture and hardware integration capabilities for modern retail environments.

## Tech Stack
* **Backend:** .NET 10 (ASP.NET Core), MediatR (CQRS), Entity Framework Core
* **Frontend:** ReactNative, TypeScript, Tailwind CSS, Shadcn/UI
* **Database:** PostgreSQL (Multi-Schema Tenant Isolation)
* **Architecture:** Clean Architecture, Domain-Driven Design (DDD)

## Key Features
* **Multi-Tenant Engine:** Advanced schema-per-tenant isolation with a custom `StoreMigrationWatchdog` that automatically patches and updates store-specific schemas on demand.
* **Dynamic Promotion Engine:** Flexible pricing logic supporting "Buy X for Y" bundles and tie-up product discounts, calculated in real-time via the `CalculatePrice` engine.
* **Hardware-Ready:** Native support for ZKTeco biometric fingerprint enrollment and RFID-based employee attendance tracking via bridge APIs.
* **Inventory Intelligence:** Automated "Low Stock" and "Near Expiry" alert engine designed to minimize business wastage and optimize stock levels.
* **Global Security Filters:** Centralized architectural enforcement of data isolation and soft-delete logic (`IsActive`/`IsDeleted`) using EF Core Global Query Filters and Expression Trees.
* **Real-time Analytics:** Interactive dashboard providing instant insights into revenue, order counts, and inventory health.

## Architectural Highlights
The system follows **Clean Architecture** principles to ensure a strict separation of concerns, making the codebase highly maintainable and testable:
* **Domain:** Core business logic, entities (utilizing PostgreSQL `xmin` for concurrency), and domain exceptions.
* **Application:** Use cases, optimized DTOs, and MediatR Commands/Queries for a decoupled request pipeline.
* **Infrastructure:** Data persistence via Entity Framework Core with custom multi-tenant schema switching and external service integrations.
* **API:** RESTful endpoints with custom middleware for tenant context identification, error handling, and structured logging.

## Getting Started

### Prerequisites
* .NET 10 SDK
* Node.js (v20+)
* PostgreSQL 16+
* *(Optional)* Arduino IDE for hardware module development
