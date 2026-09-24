# GIFT Mail

Frontend preservado do GIFT MAIL PRO v1.3, preparado para Vercel.

## Arquitetura
- Frontend: Vercel
- API: Cloudflare Worker `giftmail-api`
- Banco: Cloudflare D1 `giftmail-prod-db`
- Anexos: Cloudflare R2 `giftmail-prod-attachments`
- Envio: Resend
- Entrada: Cloudflare Email Routing -> Email Worker

## Contas
- admin@giftexcellence.com.br
- compras@giftexcellence.com.br
- vendas@giftexcellence.com.br
- engenharia@giftexcellence.com.br
- financeiro@giftexcellence.com.br

## Segredos
Nunca commitar `RESEND_API_KEY`. Configure como secret no Worker.
