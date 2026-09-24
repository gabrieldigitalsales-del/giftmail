GIFT MAIL — REBUILD 1x1

Esta versão recria somente o FRONTEND e mantém o backend atual intacto.

Teste local:
1. Extraia a pasta.
2. Execute START_LOCAL.bat.
3. Abra http://localhost:8080 se não abrir automaticamente.
4. Use o login normal do GIFT Mail.

No localhost, o frontend chama diretamente a API oficial:
https://giftmail-api.giftexcellence.com.br

Para produção:
- Substitua na raiz do GitHub apenas: index.html, app.js, styles.css, assets/ e vercel.json.
- NÃO mexa na pasta backend.
- NÃO altere Cloudflare/D1/R2/Resend.

O que foi reconstruído:
- sidebar e proporções baseadas na referência aprovada;
- topbar, lista e painel de leitura;
- janela Novo e-mail compacta;
- campo Assunto maior;
- área de digitação inteira clicável;
- assinatura separada do editor para nunca sobrepor texto;
- scroll interno do corpo/assinatura;
- configurações e handlers atuais preservados.

V2 — CAMPO ASSUNTO REDIMENSIONÁVEL
- Arraste a pequena alça horizontal logo abaixo de Assunto.
- Altura mínima: 39 px.
- Altura máxima: 140 px.
- A área da mensagem se ajusta automaticamente.
- A altura escolhida fica salva neste navegador.
- Clique duplo na alça para voltar ao tamanho padrão.


V3: A alca de redimensionamento agora controla a AREA DA MENSAGEM (abaixo da barra de formatacao), nao o Assunto. Duplo clique restaura o tamanho padrao.
