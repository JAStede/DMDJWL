# DMD JWL contactformulier – voorbereide Cloudflare Worker

Deze bestanden zijn **niet gedeployed**. Het bestaande formulier blijft uitgeschakeld totdat de nieuwe Cloudflare-account is ingericht en de verzending aantoonbaar werkt.

1. Verbind de GitHub-repository met Cloudflare Pages in het nieuwe Cloudflare-account. Gebruik als build-output de repositoryroot (statische HTML); controleer het Pages-project en de werkelijke pages.dev-URL.
2. Maak een Worker `dmdjwl-contact` aan en upload `worker.js`. Pas de `allowed`-origins aan op de echte Pages- en eigen domein-URL's. Gebruik geen wildcard CORS.
3. Maak een **eigen D1-database** aan voor DMD JWL en voer `schema.sql` uit. Bind de database aan de Worker als `DB`. Er worden geen LJ Studio-gegevens of -databases gewijzigd.
4. Configureer een Cloudflare Send Email-binding als `SEND_EMAIL` en verifieer de afzender/ontvanger volgens de actuele Cloudflare-eisen. Configureer `FROM_EMAIL` en `TO_EMAIL` als Worker-variabelen. Het juiste zakelijke adres moet door de eigenaar worden opgegeven. Controleer mailrouting en SPF/DKIM/DMARC zonder bestaande MX-records zomaar te wijzigen.
5. Test POST, verplichte velden, origin-beveiliging, honeypot, rate limit (3 per e-mailadres per 24 uur), D1-opslag en **daadwerkelijke ontvangst van e-mail**. Controleer ook de foutmelding bij verzendfouten.
6. Pas pas na geslaagde tests `assets/contact-form.js` aan met de definitieve Worker-URL en activeer het script op `contact/index.html`. De frontend mag geen succes tonen als de Worker geen `ok:true` teruggeeft.
7. Actualiseer privacyverklaring (ontvangers, D1, bewaartermijn, contactadres), cookie-/analytics-informatie, definitieve domein-canonicals, en test mobiel/desktop.

**Let op:** deze Worker is een voorbereide implementatie. Hij is nog niet in de nieuwe Cloudflare-account getest. Controleer de actuele Cloudflare Email Sending-voorwaarden en gebruik eventueel Turnstile voor aanvullende anti-spambeveiliging. Geen API-tokens in GitHub opslaan.
