import 'dotenv/config';

function obrigatorio(chave: string): string {
  const valor = process.env[chave];
  if (!valor) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${chave}`);
  }
  return valor;
}

export const env = {
  oracle: {
    user: obrigatorio('ORA_USER'),
    password: obrigatorio('ORA_PASSWORD'),
    connectString: obrigatorio('ORA_CONNECT_STRING'),
    clientLibDir: process.env.ORA_CLIENT_LIB_DIR || undefined,
    // Wallet (Autonomous DB / mTLS): pasta do wallet descompactado e senha do wallet.
    walletDir: process.env.ORA_WALLET_DIR || undefined,
    walletPassword: process.env.ORA_WALLET_PASSWORD || undefined,
  },
  port: Number(process.env.PORT) || 3001,
};
