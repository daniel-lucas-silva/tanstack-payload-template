/**
 * Gerenciador de conexão do MongoDB com detecção de disponibilidade e
 * fallback automático para MongoDB em Memória (MongoMemoryServer) para
 * execução sem erros tanto em dev quanto em containers de preview.
 */
import net from 'node:net';
import '../bootstrap';

let memoryServer: any = null;

async function isLocalMongoReachable(uri: string, timeoutMs = 800): Promise<boolean> {
  try {
    const parsed = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, 'http://'));
    const host = parsed.hostname || '127.0.0.1';
    const port = parsed.port ? parseInt(parsed.port, 10) : 27017;

    // Se apontar para host remoto (ex: MongoDB Atlas), confia na URI
    if (host !== 'localhost' && host !== '127.0.0.1' && host !== '0.0.0.0') {
      return true;
    }

    return new Promise((resolve) => {
      const socket = net.createConnection({ host, port });
      socket.setTimeout(timeoutMs);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}

export async function getMongoUri(): Promise<string> {
  // 1. Se MONGODB_URI estiver configurado e o host responder (ou for remoto), usa diretamente
  if (process.env.MONGODB_URI) {
    const reachable = await isLocalMongoReachable(process.env.MONGODB_URI);
    if (reachable) {
      return process.env.MONGODB_URI;
    }
    console.log(`ℹ️ [MongoDB] URI local configurada (${process.env.MONGODB_URI}) indisponível. Inicializando MongoMemoryServer...`);
  }

  // 2. Inicia o MongoMemoryServer para garantir execução imediata sem erros
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    if (!memoryServer) {
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: process.env.NODE_ENV === 'production' ? 'payload-prod' : 'payload-dev',
        },
      });
      const uri = memoryServer.getUri();
      console.log(`📦 [MongoDB Memory] Instância em memória iniciada em: ${uri}`);

      // Cleanup no shutdown
      const cleanup = async () => {
        if (memoryServer) {
          console.log('🛑 [MongoDB Memory] Encerrando instância em memória...');
          await memoryServer.stop();
          memoryServer = null;
        }
      };

      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
    }
    return memoryServer.getUri();
  } catch (error) {
    console.warn('⚠️ [MongoDB] Não foi possível iniciar mongodb-memory-server:', error);
    return process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/payload-dev';
  }
}
