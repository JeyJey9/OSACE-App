# Google Drive & Arhivă O.S.A.C.E. — Roadmap & Arhitectură Master

Acest document păstrează viziunea completă și toate cele 6 faze de dezvoltare pentru modulul de arhivă și stocare cloud al asociației O.S.A.C.E.

---

## 🏛️ Arhitectură Generală

- **Stocare Cloud**: Google One (5.0 TB) atașat contului `developers@osace.ro`.
- **Backend API**: `api.osace.ro` (Express.js + Google Drive API v3 + PostgreSQL 14).
- **Portal Web**: `drive.osace.ro` (Vue 3 + Vite + Tailwind/SaaS design system).
- **Securitate**: Autentificare unificată JWT, streaming securizat prin backend proxy (evită partajarea link-urilor publice de Drive), verificare integritate SHA-256 pe fiecare fișier, jurnale de audit complete.

---

## 📋 Cele 6 Faze de Dezvoltare

### ✅ Faza 1: Backend Foundation (Finalizată)
- Conexiune OAuth 2.0 cu Google Drive API v3 (5 TB).
- Tabele PostgreSQL: `archive_folders`, `archive_documents`, `archive_folder_permissions`, `archive_document_versions`, `archive_access_log`, `archive_config`.
- Streaming securizat de încărcare și descărcare fișiere cu calcul automat SHA-256.
- Operațiuni CRUD pe foldere (creare, redenumire, atribuire categorie/departament, ștergere).
- Căutare full-text pe documente și jurnal de audit al accesărilor.

### ✅ Faza 2: Portal Web `drive.osace.ro` (Finalizată)
- Aplicație web dedicată la `https://drive.osace.ro` cu certificat SSL Let's Encrypt.
- Design minimalist Obsidian / Zinc cu paleta oficială **Royal Sapphire Blue** (`#3B82F6`).
- Suport complet pentru dispozitive mobile (iOS Safari & Android Chrome):
  - Meniu lateral glisant (Drawer cu backdrop).
  - Ferestre de dialog tip Bottom Sheet.
  - Ținte tactile mari (44px+) și suport Safe Area (iPhone notch / Android gesture bar).
- Roluri și permisiuni: Admin (Acces total), Coordonator (Upload/Manage), Voluntar (Read-Only la directoare publice).

### 🚀 Faza 3: Document Previews, Multi-Upload, Coș de Reciclare & Permisiuni Granulare (În Lucru)
- **Previzualizare Inline (In-App Preview)**:
  - Vizualizare directă în browser pentru PDF-uri, imagini (PNG/JPG/WEBP/SVG) și fișiere text fără descărcare pe disc.
- **Multi-File Drag & Drop Upload**:
  - Încărcare de loturi (batch) de fișiere simultan cu progress bar per fișier.
- **Coș de Reciclare (Trash / Soft Delete)**:
  - Ștergerea unui fișier îl mută în coș (`status = 'deleted'`).
  - Posibilitate de **Restaurare** în folderul original sau **Ștergere Definitivă** (din Google Drive & DB).
  - Buton de **Golește Coșul**.
- **Panou de Permisiuni Granulare per Folder**:
  - Interfață prin care Adminii pot acorda drepturi specifice de vizualizare/editare oricărui utilizator pe un folder anume (`archive_folder_permissions`).

### ⏳ Faza 4: Automatizări & Exporturi din Sistem (Viitor)
- **Exporturi Automate din Aplicație în Google Drive**:
  - Generare automată și salvare periodică a rapoartelor de activitate și ore ale voluntarilor.
  - Salvarea listelor de prezență și a rapoartelor de evenimente direct în folderul `10_Exports` din Drive.
- **Backup Bază de Date în Cloud**:
  - Script automatizat (cronjob) care trimite dump-urile PostgreSQL criptate direct în folderul `99_System/Backups` din Google Drive.

### ⏳ Faza 5: Integrare în Aplicația Mobilă React Native (Viitor)
- **Tab / Secțiune „Documente & Arhivă” în `osace-mobile`**:
  - Permite voluntarilor să caute, să filtreze și să citească regulamentele, ghidurile și documentele asociației direct din aplicația mobilă pe Android și iOS.
  - Descărcare locală în fișierele telefonului cu vizualizator integrat.

### ⏳ Faza 6: Optimizare Stocare Media Globală (Viitor)
- **Migrare Stocare Media Grele**:
  - Salvarea automată a galeriilor foto de la evenimente mari direct în Google Drive (pentru a economisi spațiul pe discul SSD al VPS-ului).
  - Proxying inteligent cu caching pe server pentru performanță maximă.
